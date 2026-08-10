# Pristine

[English](README.en.md) | **简体中文**

![Pristine cover](cover.png)

如果失忆是根因，那就让AI的每次重生都遵从纯净原则。

这或许是你唯一需要使用的agent skill，让你的产出永远像第一次写出来一样。 纯净、清晰、节约。

支持 Claude Code、OpenAI Codex、OpenCode、OpenClaw（开放 Agent Skill 格式）。

**当前版本：v1.3.0**

## 你需要知道

在 AI 辅助开发中，补丁的累积方式和纯人类团队不一样：

- 代码常被重写，但 **文档和记忆是跨会话唯一的桥** —— 一条过期的记录会让下一个 Agent 基于错误前提做决定。
- Agent 读的是整个文件，不是 diff —— 每一个遗留的特殊分支都在稀释真实设计的信号。
- 一个"能用"的补丁是最容易被复制的，因为它最不需要理解。每一轮打补丁，都在教下一个会话打补丁。

Pristine 是反向的力：每一次改动都像第一次写出来，让系统朝清晰演进，而不是朝熵演进。

## 你的AI需要知道

| 定律 | 含义 |
|------|------|
| **追溯根源**（No patching） | 修根因，不修症状。没有 `if` 特殊分支、没有复制改参数的逻辑、没有绕开问题的开关。补丁堆比干净重写更糟时，就重写。 |
| **代码自释**（Code explains itself） | 名字承载"是什么"。注释只说"为什么"：业务规则、约束、刻意的取舍。没有解释性注释、没有注释掉的代码块。 |
| **不留残渣**（No residue） | 没有备份、草稿、死代码、中间状态。被取代的规则就地更新，绝不追加"截至……"的说明。 |
| **部署如一**（Deployment parity） | 线上跑的就是本地审过的。没有只在线上做的快速修复 —— 仓库必须始终代表现实。 |
| **单一真源**（Nothing extra） | 每个行为只有一个来源：先复用已有的，不需要存在的就不写。非平凡逻辑留一个可运行的机械验证 —— 自检是人类的习惯，不是 AI 的机制。 |
| **会话成本**（Session cost） | 无限增长的会话和无限增长的文件是同一种熵。约 15 轮时，主动提议重置。 |
| **上线初稿**（First draft before launch） | 上线前没有存量用户：改定义，不改兼容。没有迁移、没有 `ALTER TABLE`、没有兼容层 —— 只为了承载旧形态的代码，一律删掉。 |

## 安装

把 `SKILL.md` 复制到你的 Agent 技能目录：

```bash
# Claude Code
mkdir -p .claude/skills/pristine
cp SKILL.md .claude/skills/pristine/

# OpenAI Codex
mkdir -p .agents/skills/pristine
cp SKILL.md .agents/skills/pristine/

# OpenCode
mkdir -p .opencode/skills/pristine
cp SKILL.md .opencode/skills/pristine/
```

可选：会话监视（见下）需要把 `scripts/session-watch.js` 和 `SKILL.md` 放一起 —— 或者 clone 整个仓库、让 hook 指向 clone，这样 hook 路径稳定。

## 用法

技能在你开始实现、重构、修 bug 时自动激活，也在"先打个补丁再说"的冲动出现时激活。也可以按名字主动调用：

- `pristine` —— 正式名（"we work in pristine mode"）
- `纯净原则` / `first-time` —— 别名，通过技能描述语义识别

## 会话监视（可选配套）

[`scripts/session-watch.js`](scripts/session-watch.js) 机械地执行 15 轮规则：数当前会话的真实用户轮次，超过阈值就打印提醒。把它挂成 Claude Code 的 `UserPromptSubmit` hook（每条用户消息触发；`Stop` hook 也可以）：

```json
"hooks": { "UserPromptSubmit": [ { "hooks": [ { "type": "command",
  "command": "node /path/to/scripts/session-watch.js --threshold 15" } ] } ] }
```

脚本从 hook 的 stdin 读会话记录路径 —— 不自己发现会话、没有硬编码路径、退出码永远是 0（是提醒，不是闸门）。

## Pristine 扫描（配套）

[`scripts/pristine-scan.js`](scripts/pristine-scan.js) 支撑技能的**对抗验证**层：自评不是证据（评估者就是执行者），所以"干净"的说法需要机械检查。它扫描代码库里补丁堆、残渣、上线前迁移机制的信号词 —— `migrate`/`ALTER TABLE`/`legacy`/`_old`/`_new`、`workaround`/`hotfix`/`special case`、`backup`/`dead`/`obsolete`、`note:` 注解和注释掉的代码 —— 按定律分组打印 `file:line` 命中。

```bash
node scripts/pristine-scan.js <target-dir>   # 扫描代码库
node scripts/pristine-scan.js --selftest     # 自检规则表本身
```

宁可多报，人工收敛误报（业务兜底规则、引用信号词的文档都是噪音）。退出码永远是 0 —— 提醒，不是闸门。

**给使用者的建议：自检是人类的习惯，不是 AI 的机制。** 让 AI 守住纯净，靠的不是自律而是系统 —— 把扫描挂进你的 CI 或提交前钩子。

## 示例

见 [examples/before-after.md](examples/before-after.md)：补丁本能 vs. 首次动作的并排对比。

## 致谢

复用阶梯（reuse ladder）和 `pristine:` 注释标记受 [ponytail](https://github.com/DietrichGebert/ponytail)（MIT）启发。

## 许可证

MIT © 2026

[English](README.en.md) | **简体中文**
