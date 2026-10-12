# Contributing to VANTA Signal OS

Thank you for your interest in contributing to **VANTA Signal OS**! We welcome bug reports, feature suggestions, architectural improvements, and code contributions.

---

## 1. Code of Conduct

Please treat all contributors and users with kindness, respect, and constructive collaboration.

---

## 2. Development Workflow

### Branching Strategy
- Branch from `main`:
  - Features: `feature/your-feature-name`
  - Bug fixes: `fix/issue-description`
  - Documentation: `docs/what-changed`

### Commit Message Conventions
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope): add new capability`
- `fix(scope): resolve bug or edge case`
- `docs(scope): update documentation`
- `refactor(scope): internal restructuring without behavior change`
- `test(scope): add or improve test coverage`

---

## 3. Local Setup & Verification

Before submitting a Pull Request, verify that all checks pass:

### Backend Checks
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -q
python -m compileall app tests
```

### Frontend Checks
```bash
cd frontend
npm run typecheck
npm run build
```

---

## 4. Submitting a Pull Request

1. Fork and create a branch from `main`.
2. Make focused, well-tested commits.
3. Verify that both backend and frontend build cleanly with zero errors.
4. Submit your Pull Request detailing the problem solved, architectural choices, and verification steps.
