# Git: branch naming & commits – Event RSVP

Áp dụng khi tạo branch, commit, mô tả PR (single-repo).

## 1. Branch name

```
<type>/<short-description>
```

Hoặc nếu dùng ticket/issue:

```
<type>/<ISSUE-123>-<short-description>
```

- **type:** `feat`, `fix`, `hotfix`, `refactor`, `chore`, `test`, `docs`, `ci`.
- **short-description:** kebab-case, ngắn, mô tả rõ.

Ví dụ:

- `feat/rsvp-guest-form`
- `fix/email-validation`
- `chore/tailwind-config`

## 2. Commit message (Conventional Commits)

Một dòng subject:

```
<type>(<scope>): <short description>
```

- **scope:** optional – `app`, `api`, `ui`, `db`, hoặc tên module.
- **short description:** imperative, tiếng Anh; không kết thúc bằng dấu chấm; ~72 ký tự.

Ví dụ:

```
feat(rsvp): add guest response form
fix(api): validate event id on submit
chore: pin Node version in package.json
```

Body (optional): context, breaking changes, link issue.

## 3. PR

- Base branch: `main` hoặc `develop` (theo team).
- Nếu có dependency giữa PR: ghi rõ **Depends on** và **Merge order** trong mô tả.

## 4. Nguyên tắc

- Một commit một ý chính khi có thể.
- Không commit file build/cache (`.next`, `node_modules`, v.v.) – đảm bảo `.gitignore` đúng.
