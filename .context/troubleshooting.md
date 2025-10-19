# Troubleshooting

## `git checkout` command failed during project scaffolding

**What you see**
- Generator logs “Initializing git repository.” and then fails with `git checkout command failed.`
- The folder has been created, but no commit was made and the CLI exits with status 1.
- With the latest CLI you will also see the exact git command, exit code, and stderr (for example: `Failed to run "git checkout -B main" ... Git stderr: fatal: your current branch 'main' does not have any commits yet.`).

**Why it happens**
- In a brand-new git repo there is no `HEAD` yet.
- The CLI used to run `git checkout -B <branch>` during the initial sync, but Git refuses that command without an existing commit, triggering the failure.

**How to fix it manually**
1. `cd` into the generated folder (for example `examples/multi-client-demo`).
2. If Git says `pathspec '<branch>' did not match any file(s) known to git`, create the branch in “orphan” mode: `git checkout --orphan main` (replace `main` with the configured default branch).
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
- In addition, the CLI no longer re-runs `git checkout <branch>` when the repository is still unborn, avoiding the `pathspec` error entirely.

## GitHub PR creation fails with “branch has no history in common with main”

**What you see**
- The generator completes scaffolding, installs dependencies, and pushes a branch, but the final step fails with:  
  `Validation Failed: {"resource":"PullRequest","code":"custom","message":"The <branch> branch has no history in common with main"}`
- GitHub rejects the pull request because the generated branch and the default branch diverge completely.

**Why it happens**
- The CLI fell back to creating a local default branch without pulling the remote history first.
- This can happen when the generator cannot fetch the remote default branch (for example, missing permissions, or an older build that fetched via a one-off URL and then tried to check out `origin/<branch>` which never existed locally).
- The resulting branch is rooted in an orphan commit, so GitHub refuses to compare it against the real `main`.

**How to fix it manually**
1. Grant the `GITHUB_TOKEN` scope to read the target repository (at minimum: `repo` for private repositories).
2. Inside the generated folder run:  
   `git fetch origin main`  
   `git reset --hard origin/main`  
   This aligns your local `main` with the remote history.
3. Re-run the generator so that the feature branch is created from the refreshed `main`.
4. If you already pushed the orphan branch, delete it on GitHub (`git push origin --delete <branch>`) before retrying.

**Permanent fix**
- Update to the latest CLI build. The fetch step now temporarily injects credentials into `origin` so `git fetch origin <branch>` succeeds, and we abort early if the remote checkout still fails. That guarantees every generated branch shares history with the remote default branch.

## `npm ERR! notarget No matching version found for @kubb/plugin-client@^2.3.0`

**What you see**
- Running the generator with the Kubb template (via `--template kubb` or a config that points at `@eduardoac/kubb-client-template`) fails during `npm install` with:  
  `npm error notarget No matching version found for @kubb/plugin-client@^2.3.0.`

**Why it happens**
- The upstream Kubb packages have moved on to the 4.x line; the older `^2.3.0` range no longer exists on npm, so the scaffolded project cannot finish installing its devDependencies.

**How to fix it manually**
1. Open `packages/kubb-api-client-template/src/template/package.json`.
2. Bump the Kubb family versions to a published release (for example `^4.1.3` for `@kubb/cli`, `@kubb/core`, `@kubb/plugin-client`, `@kubb/plugin-oas`, `@kubb/plugin-ts`).
3. Run `npm run build --workspace @eduardoac/kubb-api-client-template` so the compiled template under `dist/template/package.json` picks up the new versions.
4. If you need the generated project to install cleanly on Node 20+, make sure your runtime satisfies the engines declared by those packages (Kubb 4.x warns when Node <20).
5. Delete any partially generated folders and rerun the CLI command.

**Permanent fix**
- The repository now pins the scaffolded Kubb dependencies to `^4.1.3`. Pull the latest changes or upgrade to the next published CLI build to get the updated `@eduardoac/kubb-api-client-template` out-of-the-box.
