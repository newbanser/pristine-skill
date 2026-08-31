# Pristine — 纯净原则

![Pristine](cover.png)

![LICENSE](https://img.shields.io/badge/LICENSE-MIT-333?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.2-8B5CF6?style=flat-square)
![Agent Skills](https://img.shields.io/badge/Agent_Skills-Standard-8B5CF6?style=flat-square)
![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-D97706?style=flat-square&logo=anthropic&logoColor=white)
![Codex](https://img.shields.io/badge/Codex-Skill-10B981?style=flat-square&logo=openai&logoColor=white)
![40+ Agents](https://img.shields.io/badge/40%2B_Agents-Compatible-3B82F6?style=flat-square)

如果失忆是根因，那就让 AI 的每次重生都遵从纯净原则。

这或许是你唯一需要的 agent skill——让你的产出永远像第一次写出来一样。纯净、清晰、节约、客观、对抗。

支持 Claude Code、OpenAI Codex、OpenCode、OpenClaw、Doubao。

> 当前版本 **v2.2** · 更新说明见 [CHANGELOG](CHANGELOG.md)

---

## 你得到什么

**少烧 token。** 同类任务，它的输出少 **78%**。长会话按水位关门，不再为已经被遗忘的内容反复付费——省的钱是结果，省下的时间才是目的。

**少返工。** 确定性评测 **8/8 任务零翻车**：完整但不冗余。真正的"简洁"不是省到不可用，而是该有的都有、不该有的一样不多。

**少盯梢。** 它不盲从你的前提、不自动加戏、下结论前先找反证。你不需要在它身边守着，等它跑偏再拉回来。

**少糟心。** 代码不留补丁堆、文档不悄悄腐烂、同一条规则永远只有一处真源。改一处，全世界跟着变。

## 有证据，不是空话

同一个模型、同一批任务，三组对比：0 安装 / 装了 Pristine / 同类热门极简 skill。结果看得见：

![确定性评测三组对比|630](benchmarks/results/benchmark-deter.svg)

**实例：模糊前提** — 用户说"接口 500，应该是数据库慢了"：

- **没装：** 也质疑了，但铺垫一大堆、每步配 SQL 示例，信息密度低
- **只要求简洁：** "加索引、优化SQL、缓存"——一句话术语，没法执行
- **装了 Pristine：** 先质疑前提，再给可执行步骤，最后收在"完成后给我慢查询日志"：

> 先确认：返回 500 不一定是数据库慢。先看日志确认错误堆栈和慢查询，再优化。
> 1. 查日志：看 500 的具体错误类型（连接超时、锁等待、连接池耗尽）
> 2. 查慢查询：`EXPLAIN ANALYZE` 找最耗时的 SQL
> 3. 查连接池：`SHOW PROCESSLIST` 看是否连接堆积
> 4. 查系统指标：CPU 高是查询重，IO 高是索引缺，内存高要查缓存
> 完成后提供慢查询日志和 `SHOW PROCESSLIST`，我给具体修复。

**实例：实现登录** — 没装：自动加注册、加前端教程，撞了 token 上限，核心代码没写完；只要求简洁：代码紧凑但密码明文存储；装了 Pristine：只做接口，salt+pbkdf2 加盐哈希，预处理防注入。

> 可复现：`python3 benchmarks/deter/skillbench-deter.py`；完整数据与方法见 `benchmarks/results/REPORT.md`。

## 一分钟上手

跟你的 AI 说这一句就行，它会自己装好：

```
帮我安装这个 skill：https://github.com/newbanser/pristine-skill
```

想先试后装？把 [`SKILL.md`](SKILL.md) 全文当提示词发给 AI，立刻进入纯净模式。

---

**想深入了解**（怎么工作、边界在哪）→ [完整指南](docs/guide.md)
**更新记录** → [CHANGELOG](CHANGELOG.md)
**讨论** → [GitHub Discussions](https://github.com/newbanser/pristine-skill/discussions)

---

由 [白露](https://github.com/bailu-agent) 出品。MIT License。Star 如果它帮你少打了一个补丁。
