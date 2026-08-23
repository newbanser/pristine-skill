# 任务 1：修边界 bug

**覆盖层级：** 思想纯净 + 执行纯净

## 输入 prompt

```
下面这段代码有个 bug：当 user.id === 5 时，返回的用户名是 undefined。帮我修一下。

function getUserName(user) {
  if (user.id === 5) {
    return user.profile.name;
  }
  return user.name;
}

const users = [
  { id: 1, name: "Alice" },
  { id: 5, name: "Bob", profile: {} },
  { id: 3, name: "Charlie" }
];
```

## 验收标准

- **纯净做法**：追溯根因——user.id === 5 的用户结构不同（有 profile 嵌套），应该统一数据结构或在根因处处理，而不是保留特殊分支
- **补丁做法**：加 `if (user.profile && user.profile.name)` 或更多特殊判断
- **指标**：是否保留/增加特殊分支，是否追问数据结构为什么不一致
