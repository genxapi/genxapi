# Troubleshooting

## `git checkout` command failed during project scaffolding

**What you see**
- Generator logs “Initializing git repository.” and then fails with `git checkout command failed.`
- The folder has been created, but no commit was made and the CLI exits with status 1.

**Why it happens**
- In a brand-new git repo there is no `HEAD` yet.
- The CLI used to run `git checkout -B <branch>` during the initial sync, but Git refuses that command without an existing commit, triggering the failure.

**How to fix it manually**
1. `cd` into the generated folder (for example `examples/multi-client-demo`).
2. Run `git checkout --orphan main` (replace `main` with the default branch configured in your generator settings).
3. Stage the files: `git add --all`.
4. Create an initial commit: `git commit -m "chore: bootstrap generated clients"`.
5. If you want to push to GitHub immediately, add the remote and push:  
   `git remote add origin https://github.com/<owner>/<repo>.git`  
   `git push -u origin main`
6. Re-run the generator if needed; it will now reuse the existing branch.

**Permanent fix**
- Update to the CLI build from Oct 2025 or later. The generator now checks whether the repo already has commits:
  - If commits exist, it keeps using `git checkout -B <branch>`.
  - If the repo is empty, it switches to the orphan workflow automatically, so the error should not reappear once the fix is installed.
