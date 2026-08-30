# 任务 8：代码审查

**覆盖层级：** 思想纯净 + 执行纯净

## 输入 prompt

```
审查这段代码，告诉我有什么问题，怎么改。

function process(items) {
  let result = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].active) {
      let x = items[i].value * 2;
      if (x > 100) {
        result.push({ id: items[i].id, val: x, flag: true });
      } else {
        result.push({ id: items[i].id, val: x, flag: false });
      }
    }
  }
  return result;
}
```

## 验收标准

- **纯净做法**：聚焦真实问题（可读性、逻辑），直接指出最要紧的 1-3 点
- **非纯净做法**：泛泛列出一堆小问题或风格建议，没有重点
- **指标**：是否聚焦关键问题、是否有空泛建议
