### 🌟 Best Practices for the Project

1. **Maintain Type Safety End-to-End**: Since we’re using TypeScript and Orval-generated types, always ensure that new code adheres to strong typing. This will keep the codebase robust and help catch issues early.

2. **Consistent Linting and Formatting**: With ESLint in place, make sure to run linting checks as part of your CI pipeline. This keeps the code style consistent and makes collaboration smoother.

3. **Semantic Versioning for Releases**: Always follow semantic versioning when publishing new versions of the library. This way, consumers understand the impact of changes (patch, minor, major) and can upgrade confidently.

4. **Automated Testing for Generated Clients**: Incorporate automated tests for the generated client code to ensure that every release is stable. This can be part of your CI pipeline, providing an extra layer of confidence.

5. **Clear Documentation and Usage Examples**: Make sure the generated projects include clear documentation and examples so that users can get started quickly and understand best practices for their own implementations.

6. **Keep Files Focused (~100 Lines)**: Aim to keep source files under roughly 100 lines to promote readability; if a feature genuinely needs a longer module, ensure it is well structured and justified.

7. **Favour Reusable, Composable Logic**: Extract shared utilities instead of duplicating code. Smaller, composable functions make diffs easier to review and the generator easier to extend.

8. **Robust Testing (Unit & Integration)**: Back new logic with unit tests and add integration coverage when behaviour crosses package boundaries. Use tools such as Vitest + msw to simulate HTTP interactions without hitting real endpoints.
