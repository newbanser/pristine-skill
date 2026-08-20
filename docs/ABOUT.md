# GitHub About（仓库「关于」）管理

## 真源与同步

- 文案唯一真源：`docs/about.txt`（一行）
- 改文案 = 改 `about.txt`，然后执行：

```bash
gh repo edit newbanser/pristine-skill --description "$(cat docs/about.txt)"
```

- **禁止直接 `gh repo edit --description` 裸改**：About 不进 git，裸改 = 无痕改动，漂移后无从发现，直到肉眼看到
- 发版流程中「gh 描述」一步 = 执行上述同步命令，不得另行编写文案

## 定稿历史

- 2026-08-10：定稿格言版（演化史见 `bailu/03-episodic/2026-08-10-纯净原则About定稿.md`）
- 2026-08-21：恢复——此前被换成特性罗列版（定稿时已否掉的写法），无痕漂移，肉眼发现
