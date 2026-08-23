# Pristine — 纯净原则

![Pristine](cover.png)

![LICENSE](https://img.shields.io/badge/LICENSE-MIT-333?style=flat-square)
![Agent Skills](https://img.shields.io/badge/Agent_Skills-Standard-8B5CF6?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Codex](https://img.shields.io/badge/Codex-Skill-10B981?style=flat-square&logo=openai&logoColor=white)
![40+ Agents](https://img.shields.io/badge/40%2B_Agents-Compatible-3B82F6?style=flat-square)

如果失忆是根因，那就让 AI 的每次重生都遵从纯净原则。

这或许是你唯一需要的 agent skill——让你的产出永远像第一次写出来一样。纯净、清晰、节约。

支持 Claude Code、OpenAI Codex、OpenCode、OpenClaw、Doubao。

---

## 使用前后对比

> 实测：DeepSeek Chat，6 任务 × 2 组 × 3 次 = 36 次调用。完整数据见 `benchmarks/results/REPORT.md`。

### 输出 tokens 平均减少 77.4%

| 任务 | 无 pristine | 有 pristine | 减少 |
|---|---|---|---|
| 修边界 bug | 356 | 98 | 72.5% |
| 实现登录 | 4096（截断） | 795 | 80.6% |
| 模糊前提回答 | 1216 | 196 | 83.9% |
| 重构重复代码 | 617 | 252 | 59.2% |
| 解释概念 | 969 | 177 | 81.7% |
| 加新功能 | 1933 | 267 | 86.2% |

### 实例：模糊前提

用户说："接口返回 500，应该是数据库慢了。"

**无 pristine（1216 tokens）：** 直接接受前提，给六大维度优化方案（缓存、索引、SQL、架构、硬件、监控）。

**有 pristine（196 tokens）：**

> 先加慢查询日志，确认是不是数据库。
>
> 1. 查慢查询日志：`SHOW VARIABLES LIKE 'slow_query_log'`
> 2. 分析慢查询：`EXPLAIN` 看有没有全表扫描
> 3. 修最慢的一条：一般是缺索引
> 4. 确认：重跑 `EXPLAIN`，看 `rows` 是否下降
>
> 完成后告诉我 slow log 里最慢的那条 SQL。

### 实例：实现登录

**无 pristine：** 自动加了注册、前端页面（login.html/register.html/dashboard.html），4096 tokens 撞到上限被截断。

**有 pristine（795 tokens）：** 只做登录+注册接口，用 better-sqlite3 预处理语句防注入，用 Node 内置 crypto 做哈希（不引入 bcrypt），有具体下一步。

### 关键发现

- 输出 tokens 平均减少 77.4%
- 无 pristine 组 1/6 任务被截断（无限输出）
- 思想纯净有效：先质疑前提，不接受未验证假设
- 规划纯净有效：只做目标内的事，不自动加功能
- 小任务有固定成本：SKILL.md ~2800 tokens，小任务总 tokens 反而增加；大任务收益明显

---

## 你需要知道

### 熵增是物理规律

封闭系统从有序走向无序。代码、文档、记忆、会话都是信息系统，不维护即熵增。

人类靠直觉和常识自发对抗熵增。AI 没有这两个机制，它会忠实执行混乱。AI 不是熵增的原因，是熵增的放大器。

### AI 有三个无法自愈的缺陷

| 缺陷 | 后果 |
|---|---|
| **失忆** | 无持久记忆，跨会话靠文件续命。文件会腐烂（路径变、计数改、旧名残留），而 AI 全量读文件、不读 diff——一个过期条目就是下一次会话的虚假前提 |
| **成本** | 上下文窗口是硬约束。长会话后期运行在截断/陈旧上下文上，等于半失忆状态。且 75% 水位后每轮成本是开头的 3-5 倍，34 轮会话的尾部 25% 占总成本 50% |
| **多真源** | 同一规则多处定义，AI 不会去确认，随机选取或混合使用。多真源 = 无真源。打补丁就是写第二本圣经 |

这三个问题 AI 自己修不了。需要一套外部纪律，在每次改动时重置熵增。

### 纯净原则 = 反向力

七律是具体的对抗手段，四层框架是对抗的范围（从思想到输出），机械验证是落地机制（评估者=执行者，自评不可靠）。

核心格言"像第一次写一样写一切"：每次改动重置熵增，不积累历史包袱。经济性倒逼可靠性。

因果链：熵增（物理规律）→ AI 无兜底（放大）→ 三缺陷（无法自愈）→ 纯净原则（反向力）

### 它不做什么

纯净原则不是银弹。它不保证代码正确，不保证功能完整，不替代测试和 review。它只保证一件事：**系统不熵增**。

一个纯净的 bug 仍然是 bug。一个纯净的错误架构仍然是错误架构。纯净是底线，不是上限——它让你在正确的方向上走得更远，不保证你方向正确。

它也不适合所有场景：探索性原型、一次性脚本、 throwaway 代码不需要纯净。纯净的成本是思考时间，不值得为活三天的代码付这个成本。

## 你的AI需要知道

### 七律

| 定律 | 含义 |
|---|---|
| **追溯根源**（No patching） | 修根因不修症状。不加特殊分支、不复制改参数、不加开关绕问题。补丁堆比干净重写更糟时就重写 |
| **代码自释**（Code explains itself） | 名字承载"是什么"，注释只说"为什么"。无解释性注释、无注释掉的代码 |
| **不留残渣**（No residue） | 无备份、草稿、死代码、中间状态。被取代的规则就地更新，不追加"截至……" |
| **部署如一**（Deployment parity） | 线上跑的就是本地审过的。无只在线上做的快速修复 |
| **单一真源**（Nothing extra） | 每个行为只有一个来源。先复用已有的，不需要存在的就不写 |
| **会话成本**（Session cost） | 无限增长的会话和无限增长的文件是同一种熵。按水位重置不按轮次，重置前写检查点 |
| **上线初稿**（Before launch） | 上线前无存量用户。改定义不改兼容，无迁移、无兼容层 |

### 四层框架（v2）

v2 把纯净从代码延伸到四个层级，形成因果链：思想不纯 → 规划跑偏 → 执行发散 → 输出冗余。修输出不修上层是打补丁。

| 层级 | 管什么 | 对应七律 |
|---|---|---|
| **思想纯净**（输入层） | 接受什么前提、拒绝什么、不携带什么进入下一轮 | 1、5 |
| **规划纯净**（决策层） | 目标如何拆解、纳入什么排除什么、执行前如何校验 | 7 |
| **执行纯净**（行动层） | 动作如何执行、用什么工具、状态如何追踪、会话如何管理 | 1、3、4、6 |
| **输出纯净**（交付层） | 产物和对话的形式与密度 | 2、5、7 |

输出层新增**对话纯净**9 条：答案先行、多步编号、收尾给具体下一步、抑制跑题、事实语气、列表不超 5 项、无开场收尾客套、具体时间估计、成果可见。完整规则见 `SKILL.md`。

## 安装

**一句话安装（推荐）：** 直接跟你的 Agent 说：

```
帮我安装这个 skill：https://github.com/newbanser/pristine-skill
```

Agent 会自己 clone 到对应目录，不用操心路径。

**手动安装：** 把 `SKILL.md` 复制到你的 Agent 技能目录：

```bash
# Claude Code
mkdir -p .claude/skills/pristine && cp SKILL.md .claude/skills/pristine/

# OpenAI Codex
mkdir -p .agents/skills/pristine && cp SKILL.md .agents/skills/pristine/

# OpenCode
mkdir -p .opencode/skills/pristine && cp SKILL.md .opencode/skills/pristine/
```

零安装用法：把 `SKILL.md` 全文作为提示词发给 AI，从此进入纯净模式。

## 用法

技能在开始实现、重构、修 bug 时自动激活，也在"先打个补丁再说"的冲动出现时激活。

主动调用：说 `pristine`、`纯净原则` 或 `first-time`。

三个触发层级：

- **纯净原则** — 即时纠偏。"你这么做符合纯净原则么"→ 当场对照回答
- **纯净自检** — 阶段性自查。"你先停一停，自检一下"→ 逐条报告
- **纯净扫描** — 机械兜底。"扫描一下"→ 跑脚本，以输出为准

## 配套工具

七律是意图，不是机制。意图靠人执行，而人的提醒和自评都不可靠——所以纯净落到代码上要靠脚本兜底。

### 纯净扫描（pristine-scan）

扫代码库里的补丁堆、残渣、上线前迁移机制的信号词，以及死代码和 SOURCE 标注核销。宁可多报，人工收敛误报。

```bash
node scripts/pristine-scan.js <target-dir>   # 扫描代码库
node scripts/pristine-scan.js --selftest     # 自检规则表本身
node scripts/pristine-scan.js --map <dir>    # 生成 SOURCE 标注地图
```

### 记忆漂移扫描（memory-scan）

记忆是跨会话唯一的桥，一个过期条目让下一个 Agent 基于错误前提做决定。查断链、已删声称、数字漂移。

```bash
node scripts/memory-scan.js <memory-dir> <repo-dir>
```

### 会话监视（session-watch）

挂成 hook，机械监控上下文水位。70% 软提醒，80% 硬阻断（抢在平台 83-84% 自动压缩前关门），阻断瞬间自动备份最近 150 行对话原文。双表计量：水位表看池子剩多少，水表看这池用了多少。

```json
"hooks": {
  "UserPromptSubmit": [{
    "hooks": [{
      "type": "command",
      "command": "node /path/to/scripts/session-watch.js --threshold 70 --block 80 --max 200000 --checkpoint /path/to/.claude/checkpoint.md --backup /path/to/backup"
    }]
  }]
}
```

## 一句话

自检是人类的习惯，不是 AI 的机制。让 AI 守住纯净，靠的不是自律而是系统。

---

由 [白露](https://github.com/bailu-agent) 出品。

MIT License. Star 如果它帮你少打了一个补丁。
