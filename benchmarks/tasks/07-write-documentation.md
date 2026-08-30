# 任务 7：写 API 文档

**覆盖层级：** 输出纯净（文档）

## 输入 prompt

```
给下面这个函数写一份使用文档。函数已经能正常工作，不要改代码。

function calculateShipping(basePrice, weight, country) {
  const rate = { US: 0.1, CA: 0.12, EU: 0.15 };
  const base = basePrice * rate[country] || basePrice * 0.2;
  return base + weight * 2;
}
```

## 验收标准

- **纯净做法**：文档只写必要信息（参数、行为、边界），不铺陈模板化的"概述/背景/最佳实践"
- **非纯净做法**：生成模板化长文档（背景介绍、架构说明、FAQ），大量空话
- **指标**：文档长度、是否包含模板化空话
