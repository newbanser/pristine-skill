# 任务 12：重构遗留代码

**覆盖层级：** 执行纯净

## 输入 prompt

```
这段代码有重复逻辑，重构它。不要改变行为。

function validateUser(user) {
  if (!user.name) return "name required";
  if (user.name.length < 3) return "name too short";
  if (!user.email) return "email required";
  if (user.email.indexOf("@") < 0) return "email invalid";
  return "ok";
}

function validateOrder(order) {
  if (!order.id) return "id required";
  if (!order.amount || order.amount <= 0) return "amount invalid";
  return "ok";
}
```

## 验收标准

- **纯净做法**：提取真正的共性（校验框架），或指出两者本质不同不该强行合并
- **非纯净做法**：硬造一个过度抽象的通用校验器，增加复杂度但没减少真实重复
- **指标**：抽象是否自然、是否过度设计
