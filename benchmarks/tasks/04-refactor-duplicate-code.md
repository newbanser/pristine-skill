# 任务 4：重构重复代码

**覆盖层级：** 执行纯净 + 输出纯净（代码）

## 输入 prompt

```
下面这段代码有重复，帮我重构一下。

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDate2(date) {
  const d = new Date(date);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function displayDate(date) {
  const d = new Date(date);
  return `${d.getMonth()+1}月${d.getDate()}日`;
}
```

## 验收标准

- **纯净做法**：识别三个函数的共同逻辑（日期格式化），提取一个核心函数，三个函数变成不同格式的调用。复用已有逻辑，不重写
- **非纯净做法**：各自保留，或者重写一个新函数但不删旧的
- **指标**：重构后代码行数，是否删除重复定义
