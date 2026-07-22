# 🤝 Developer Contribution Guidelines

Thank you for contributing to the **Enterprise AI Crop Planning System**! Follow these guidelines to ensure code quality, visual consistency, and zero breaking changes.

---

## 📜 Development Workflow

1. **Fork & Clone**:
   ```bash
   git clone https://github.com/your-username/AI-Crop-System.git
   cd AI-Crop-System
   ```
2. **Create a Feature Branch**:
   - `feature/` for new capabilities (`feature/model-explainability`)
   - `fix/` for bug fixes (`fix/artifacts-mongoose-schema`)
   - `docs/` for documentation updates (`docs/api-guide`)

   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 🎨 Coding Standards

### Frontend (React 19 + Tailwind)
- Use standard functional components with hooks.
- **Design System Primitives**: Import reusable UI primitives from `client/src/components/ui/` (`PageContainer`, `PageHeader`, `StatCard`, `SectionCard`, `ActionButton`, `DataTable`).
- **Icons**: Import icons from `react-icons/fi` or `react-icons/lu`.
- **Notifications**: Use `notify.success()`, `notify.error()`, `notify.warning()`, and `notify.info()` from `client/src/utils/toast.js`.
- **Modals**: Use `ConfirmModal` for destructive actions (Delete, Cancel, Reset, Promote).

### Backend (Node.js + Express + Mongoose)
- Keep route handlers thin; delegate data aggregation to dedicated service modules (`services/`).
- Use Mongoose `module.exports = mongoose.models.ModelName || mongoose.model('ModelName', schema);` to prevent cache duplication error.
- All endpoints must return standard JSON format: `{ success: true, message: "...", data: { ... } }`.

---

## 💬 Commit Message Format

We follow **Conventional Commits**:

```text
<type>(<scope>): <short summary>

[optional body]
```

### Allowed Types:
- `feat`: A new user-facing feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semi-colons, UI tweaks
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating unit/integration tests

### Example:
```bash
git commit -m "feat(governance): add policy enforcement modal and human approval workflow"
```

---

## 🧪 Verification Before Submitting PR

Before pushing your branch, ensure all builds and linter checks pass cleanly:

```bash
# 1. Build Client
cd client
npm run build

# 2. Run ESLint
npx eslint src/App.jsx src/components/ui
```
