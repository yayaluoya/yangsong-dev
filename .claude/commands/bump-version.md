---
description: 迭代版本号（递增次版本号 minor 并自动提交）
---

# 迭代版本号

将项目版本号递增一位次版本号（minor），并自动提交。

## 步骤

1. 在 `index.html` 中找到当前版本号字符串（形如 `v1.4.0`，位于设置弹框底部的版本号 `<div>`）。
2. 递增次版本号：中间那一位 +1，修订号（最后一位）归零。例如 `v1.4.0` → `v1.5.0`。
3. 用 Edit 工具更新 `index.html` 中的版本号。
4. 暂存并提交，commit message 沿用历史风格：`版本号更新至 vX.Y.Z`（把 `vX.Y.Z` 换成新版本号）。
   - 只暂存具体文件：`git add index.html`，不要 `git add .` / `git add -A`。
   - 不要 push、不要 amend、不要 `--no-verify` / `--no-gpg-sign`。
   - commit message 里不要出现 `claude` / `claude code` 字样，不要堆 emoji。
5. 提交后跑一次 `git status`，确认工作区干净，并告诉用户新版本号与提交短 hash。
