#!/usr/bin/env python3
"""skillbench-deter — 确定性 skill 评测（整合 ponytail 的执行式判定）

对 skill 真正有效的证明：不是 AI 评审说"达标"，而是把产出代码**执行**验证。
本程序把 ponytail（DietrichGebert/ponytail, MIT）的确定性 scorer（agentic_tasks.py）
整合进 skillbench：seed 工作目录 → 单轮生成代码 → 确定性判定 correct/safe。

  python benchmarks/deter/skillbench-deter.py --selftest
      验证 scorer：每个任务的 good 参考必须过、bad 参考必须被抓。不通过拒绝跑矩阵。
  python benchmarks/deter/skillbench-deter.py --arms empty,pristine --runs 3
      跑矩阵（花 API）。workspace 保留在 runs/<stamp>/ 可复查。

单轮限制：reuse/trace 任务需要读项目其他文件，单轮 completion 做不到，排除。
当前任务集 = ponytail 的 safety tier + cache（prompt 自包含）。

用法：
  --arms empty,pristine           对比的 system 配置（pristine = 仓库 SKILL.md）
  --tasks a,b                    默认全部单轮任务
  --runs N                       每 cell 观测次数
  --model / --api-base / --api-key
  --api-key 也可用 DEEPSEEK_API_KEY 环境变量
"""
import argparse, json, os, re, statistics, sys, tempfile, time, urllib.request
from pathlib import Path
from collections import defaultdict

sys.path.insert(0, str(Path(__file__).resolve().parent))
from agentic_tasks import TASKS   # 确定性 scorer + good/bad 参考（来源 ponytail, MIT）

ROOT = Path(__file__).resolve().parent          # benchmarks/deter
REPO = ROOT.parent.parent                       # pristine-skill 仓库根
SKILL_FILE = REPO / "SKILL.md"

# 单轮自包含任务（prompt 不需读项目其他文件）。reuse/trace 需真实 agentic，排除。
SINGLE_ROUND = ["todo-null", "safe-path", "critic-email", "rate-limit",
                "sql-user", "auth-token", "csv-sum", "cache"]

def load_arms(names):
    arms = {}
    for n in names:
        if n == "empty":
            arms["empty"] = ""
        elif n == "pristine":
            arms["pristine"] = SKILL_FILE.read_text(encoding="utf-8")
        else:
            p = Path(n)
            if not p.exists(): sys.exit(f"unknown arm '{n}' (empty/pristine/文件路径)")
            # 通用 SKILL.md 用父目录名（ponytail/SKILL.md -> "ponytail"）；否则用文件名
            name = p.parent.name if p.name.lower() == "skill.md" else p.stem
            arms[name] = p.read_text(encoding="utf-8")
    return arms

def selftest():
    """good 必须 correct+safe；bad 必须在其声明的 axis 上被抓。验证仪器再花 API 钱。"""
    failures = 0
    for tid in SINGLE_ROUND:
        task = TASKS[tid]
        axis = task.get("axis", "safe")
        for kind in ("good", "bad"):
            with tempfile.TemporaryDirectory() as d:
                for fn, content in task.get("seed", {}).items():
                    (Path(d) / fn).write_text(content, encoding="utf-8")
                (Path(d) / task["file"]).write_text(task[kind], encoding="utf-8")
                r = task["score"](Path(d))
            ok = (r["correct"] == 1 and r["safe"] == 1) if kind == "good" else (r[axis] == 0)
            print(f"{'ok ' if ok else 'XX '} {tid:12} {kind:4} correct={r['correct']} "
                  f"safe={r['safe']} axis={axis}  {r['reason']}")
            failures += 0 if ok else 1
    print(f"\nselftest: {'all instruments valid' if not failures else str(failures) + ' BROKEN'}")
    return failures

def call_api(system, user, max_tokens=4096, retries=3):
    messages = ([{"role": "system", "content": system}] if system else []) \
               + [{"role": "user", "content": user}]
    body = json.dumps({"model": MODEL, "max_tokens": max_tokens, "messages": messages}).encode()
    for a in range(retries):
        try:
            req = urllib.request.Request(API_BASE + "/chat/completions", data=body,
                headers={"Content-Type": "application/json", "Authorization": "Bearer " + API_KEY})
            with urllib.request.urlopen(req, timeout=180) as r:
                j = json.loads(r.read())
            return j["choices"][0]["message"]["content"], j["usage"]["completion_tokens"]
        except Exception as e:
            if a == retries - 1: raise
            time.sleep(2 * (a + 1))

_CODE_FENCE = re.compile(r"```[a-zA-Z0-9_+-]*\r?\n(.*?)```", re.S)

def extract_code(text):
    """取模型回答里的代码。优先取第一个围栏代码块；无围栏则取全文。统一去掉
    '=== 文件名 ===' 这类模型误抄的文件头行。"""
    blocks = _CODE_FENCE.findall(text or "")
    code = blocks[0] if blocks else (text or "")
    lines = [ln for ln in code.splitlines() if not ln.strip().startswith("===")]
    return "\n".join(lines).strip() + "\n"

def count_loc(workdir, task):
    p = workdir / task["file"]
    if not p.exists(): return 0
    return sum(1 for ln in p.read_text(encoding="utf-8", errors="ignore").splitlines()
               if ln.strip())

def run_cell(tid, arm, system_prompt, workdir):
    task = TASKS[tid]
    for fn, content in task.get("seed", {}).items():
        (workdir / fn).write_text(content, encoding="utf-8")
    # 单轮无法自主读项目文件：把 seed 内容作为"现有文件"展示给模型
    prompt = task["prompt"]
    if task.get("seed"):
        seed_txt = "\n\n".join(f"现有文件 {fn}（保持其接口与全局状态不变）:\n{content}"
                               for fn, content in task["seed"].items())
        prompt += (f"\n\n[背景]\n{seed_txt}\n\n"
                   f"请直接输出 {task['file']} 的完整文件内容。"
                   f"只输出代码本身：不要 '=== 文件名 ===' 头，不要解释文字，不要 markdown 代码围栏。")
    out, tok = call_api(system_prompt, prompt)
    (workdir / task["file"]).write_text(extract_code(out), encoding="utf-8")
    sc = task["score"](workdir)
    return {"correct": sc["correct"], "safe": sc["safe"], "reason": sc["reason"],
            "total_loc": count_loc(workdir, task), "out_tokens": tok,
            "answer_len": len(out)}

def aggregate(results):
    groups = defaultdict(list)
    for r in results: groups[(r["task"], r["arm"])].append(r)
    rows = []
    for (t, a), cells in sorted(groups.items()):
        n = len(cells)
        rows.append({"task": t, "arm": a, "n": n,
                     "correct_rate": round(sum(c["correct"] for c in cells) / n, 3),
                     "safe_rate": round(sum(c["safe"] for c in cells) / n, 3),
                     "total_loc_median": statistics.median(c["total_loc"] for c in cells) or 0,
                     "out_tokens_mean": round(sum(c["out_tokens"] for c in cells) / n)})
    return rows

def print_table(rows):
    by = defaultdict(list)
    for r in rows: by[r["task"]].append(r)
    print(f"{'task':14} {'arm':10} {'correct':>8} {'safe':>6} {'LOC':>5} {'tok':>7}")
    for t, rs in sorted(by.items()):
        for r in sorted(rs, key=lambda x: x["arm"]):
            print(f"{t:14} {r['arm']:10} {r['correct_rate']:>8} {r['safe_rate']:>6} "
                  f"{r['total_loc_median']:>5} {r['out_tokens_mean']:>7}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--arms", default="empty,pristine")
    ap.add_argument("--tasks", default=",".join(SINGLE_ROUND))
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--model", default=os.environ.get("MODEL", "deepseek-chat"))
    ap.add_argument("--api-base", default=os.environ.get("API_BASE", "https://api.deepseek.com/v1"))
    ap.add_argument("--api-key", default=os.environ.get("DEEPSEEK_API_KEY", ""))
    args = ap.parse_args()

    global MODEL, API_BASE, API_KEY
    MODEL, API_BASE, API_KEY = args.model, args.api_base, args.api_key

    if args.selftest:
        sys.exit(1 if selftest() else 0)

    if not API_KEY:
        sys.exit("缺少 API key（--api-key 或 DEEPSEEK_API_KEY）")

    if selftest():
        sys.exit("scorer 未通过 selftest（good 未过 / bad 未被抓）；拒绝花 API 跑矩阵")

    arms = load_arms([a.strip() for a in args.arms.split(",")])
    task_ids = [t.strip() for t in args.tasks.split(",") if t.strip() in TASKS]
    stamp = time.strftime("%Y%m%d-%H%M%S")
    out_dir = ROOT / "runs" / stamp
    out_dir.mkdir(parents=True, exist_ok=True)

    results = []
    for tid in task_ids:
        for arm, sys_p in arms.items():
            for r in range(args.runs):
                ws = out_dir / f"{tid}__{arm}__{r}"
                ws.mkdir(parents=True, exist_ok=True)
                try:
                    res = run_cell(tid, arm, sys_p, ws)
                except Exception as e:
                    res = {"correct": None, "safe": None, "reason": str(e)[:120],
                           "total_loc": 0, "out_tokens": 0}
                res = {"task": tid, "arm": arm, "run": r, **res}
                results.append(res)
                ok = "ok " if (res["correct"] == 1 and res["safe"] == 1) else "FAIL"
                print(f"  [{len(results)}] {tid}/{arm}/#{r} {ok} "
                      f"c={res['correct']} s={res['safe']} loc={res['total_loc']} "
                      f"tok={res['out_tokens']}  {res['reason'][:60]}")
                (out_dir / "results.json").write_text(
                    json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

    rows = aggregate(results)
    (out_dir / "summary.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\n=== 确定性评测结果（correct/safe 为执行验证）===")
    print_table(rows)
    print(f"\nwrote {out_dir}/results.json + summary.json")

if __name__ == "__main__":
    main()
