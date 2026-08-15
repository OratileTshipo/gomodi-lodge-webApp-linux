# Git Workflow & Safety Guidelines — Gomodi Guest Lodge

**Audience:** Oray (project owner), Freebuff/Codebuff (coding agent), any future collaborator or agent
**Purpose:** Prevent accidental commits/pushes to `main`, enable safe rollback, and follow an
industry-standard-but-right-sized branching model for a solo-owner project.

**Golden rule, stated once, binding everywhere in this document:**
> **Nobody — human or agent — commits directly to `main`. Ever. No exceptions.**

---

## 1. Branch Structure

| Branch | Purpose | Who can push directly | Deploys to |
|---|---|---|---|
| `main` | Always reflects what's live in production. The single source of truth for "what guests see right now." | **No one.** Only merged into via a reviewed pull request from `dev`. | Production (Vercel) |
| `dev` | Integration branch. Where finished features land before going live. | Merged into via PR from feature branches. Direct pushes discouraged but tolerated for small fixes if you're working solo. | Preview/Dev environment |
| `feature/<short-name>` | One branch per feature or fix. Created fresh from `dev`, deleted after merge. | Freely — this is the working branch. | Neon preview DB branch (see Section 4) + Vercel preview URL |

**Naming convention for feature branches** (matches your Phase 3 Implementation Setup doc):
```
feature/pricing-settings-table
feature/admin-availability-toggle
fix/pop-upload-not-wired
```

Use `feature/` for new capability, `fix/` for bug fixes — consistent with the `feat:`/`fix:` commit prefixes already defined in your Phase 3 document.

---

## 2. The Standard Workflow (Every Single Time)

This applies whether you are working locally with Freebuff CLI, or fully remotely (e.g. via a web-based agent session) when you're away from your Linux machine.

```
1. Start from an up-to-date dev branch
   git checkout dev
   git pull origin dev

2. Create a feature branch
   git checkout -b feature/whatever-you-are-building

3. Work, commit locally as you go (small, frequent commits are fine here)
   git add .
   git commit -m "feat: add pricingSettings table"

4. Push the feature branch to GitHub (NOT main, NOT dev)
   git push -u origin feature/whatever-you-are-building

5. Open a Pull Request on GitHub: feature/whatever-you-are-building → dev
   - This is where the Neon preview database branch gets created automatically
     (see Section 4) and where you test the change safely.

6. Test on the Neon preview branch + Vercel preview deploy.
   Only once it works end-to-end:

7. Merge the PR into dev (via the GitHub "Merge pull request" button —
   not a local merge + push)

8. Once dev has been tested and is stable, open a SECOND pull request:
   dev → main

9. Merge that PR into main. This triggers the production deploy.

10. Tag the release on main (see Section 3).

11. Delete the feature branch (GitHub can do this automatically on merge).
```

**Why two PRs (feature→dev, then dev→main) instead of one?** It gives you two
checkpoints instead of one. A single bad feature branch never reaches `main`
directly, even if you rush step 6.

---

## 3. Tagging Releases

Every time `dev` is merged into `main` and deployed, tag that commit on `main`:

```bash
git checkout main
git pull origin main
git tag -a v1.4.0 -m "Pricing settings table, admin settings screen, POP upload fix"
git push origin v1.4.0
```

**Versioning convention** (simple, right-sized — not strict semver policing):
- Increment the middle number (`v1.4.0` → `v1.5.0`) for a new feature.
- Increment the last number (`v1.4.0` → `v1.4.1`) for a bug fix only.
- Increment the first number only for a major relaunch (e.g. go-live day).

**Why this matters for rollback:** if something breaks after a deploy, you (or I,
once you paste the log) can immediately identify and return to the last tagged
version:

```bash
git checkout main
git reset --hard v1.4.0
git push origin main --force-with-lease
```

`--force-with-lease` (not plain `--force`) refuses the push if someone else
pushed to `main` since you last pulled — a safety check that prevents silently
destroying someone else's work. Since you're the sole approver on this project,
this is a reasonable safety net rather than heavy process.

---

## 4. Neon Database Branching — Now Tied to This Workflow

Because the PR-based workflow above is now in place, the Neon GitHub Actions
workflow from our earlier setup will trigger correctly: **every PR into `dev`
or `main` creates an isolated, disposable copy of your database**, so a schema
change (like the new `pricingSettings` table) can be tested without any risk
to your real data.

### Updated workflow file — now with migrations enabled

Below is the same YAML as before, with the commented-out migration step
turned on, since we now have a real PR flow to trigger it against. Save this
as `.github/workflows/neon_workflow.yml`, replacing the previous version.

```yaml
name: Create/Delete Branch for Pull Request
on:
  pull_request:
    types:
      - opened
      - reopened
      - synchronize
      - closed
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
jobs:
  setup:
    name: Setup
    outputs:
      branch: ${{ steps.branch_name.outputs.current_branch }}
    runs-on: ubuntu-latest
    steps:
      - name: Get branch name
        id: branch_name
        uses: tj-actions/branch-names@v8

  create_neon_branch:
    name: Create Neon Branch
    outputs:
      db_url: ${{ steps.create_neon_branch.outputs.db_url }}
      db_url_with_pooler: ${{ steps.create_neon_branch.outputs.db_url_with_pooler }}
    needs: setup
    if: |
      github.event_name == 'pull_request' && (
      github.event.action == 'synchronize'
      || github.event.action == 'opened'
      || github.event.action == 'reopened')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Get branch expiration date (14 days from now)
        id: get_expiration_date
        run: echo "EXPIRES_AT=$(date -u --date '+14 days' +'%Y-%m-%dT%H:%M:%SZ')" >> "$GITHUB_ENV"

      - name: Create Neon Branch
        id: create_neon_branch
        uses: neondatabase/create-branch-action@v6
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch_name: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}
          expires_at: ${{ env.EXPIRES_AT }}

      - name: Run Migrations
        run: npx drizzle-kit migrate
        env:
          DATABASE_URL: "${{ steps.create_neon_branch.outputs.db_url_with_pooler }}"

      - name: Post Schema Diff Comment to PR
        uses: neondatabase/schema-diff-action@v1
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          compare_branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}

  delete_neon_branch:
    name: Delete Neon Branch
    needs: setup
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Delete Neon Branch
        uses: neondatabase/delete-branch-action@v3
        with:
          project_id: ${{ vars.NEON_PROJECT_ID }}
          branch: preview/pr-${{ github.event.number }}-${{ needs.setup.outputs.branch }}
          api_key: ${{ secrets.NEON_API_KEY }}
```

> The live workflow (`.github/workflows/neon_workflow.yml`) now applies
> **versioned migrations** (`npx drizzle-kit migrate`, with a fallback to
> `push` only until the parent DB adopts migrations via `npm run db:adopt`)
> and fetches the connection string via `neonctl`, not the action output
> (which GitHub blanks as a secret — see knowledge.md).

**Important note on schema changes:** every change to `lib/db/schema.ts` ships
as a **versioned migration** (`drizzle-kit generate` → commit `drizzle/*.sql`)
and is applied with `db:migrate` in CI and deploys (ADR 012). The schema-diff
comment on the PR remains your main safety check before merging — read it
every time before approving a PR that touches `lib/db/schema.ts`.

**Required GitHub repo settings** (if not already done from our last
conversation):
- Repository secret `NEON_API_KEY`
- Repository variable `NEON_PROJECT_ID` = `holy-sunset-56816517`
- Repository setting: **Settings → Branches → Add branch protection rule** for
  `main` — see Section 5 below, this is what actually *prevents* accidental
  direct commits, not just discourages them.

---

## 5. Branch Protection — The Actual Safety Net (Do This on GitHub, Not Just Agree To It)

Guidelines alone don't stop an accidental `git push origin main` — a technical
guardrail does. Set this up once, in your GitHub repository settings:

1. Go to your repo → **Settings → Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Enable:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging** (once you have any
     CI checks — even just "build succeeds")
   - ✅ **Do not allow bypassing the above settings** (this is the one that
     actually blocks *you* too, including accidental direct pushes)
5. Repeat the same rule for `dev`, with slightly looser settings if you want
   to allow yourself direct small pushes there — your call, but `main` should
   have no exceptions.

Once this is set up, a direct push to `main` — by you, by Freebuff, by anyone
— will be **rejected by GitHub itself**, not just discouraged by a document.
This is the single most important step in this entire guide.

---

## 6. Instructions for Freebuff / Any Coding Agent

Paste this section (or the whole file) somewhere Freebuff reads on startup —
e.g. `.agents/GIT_RULES.md` or your `knowledge.md`.

> **Git rules for this project — follow exactly, no exceptions:**
> 1. Never run `git push origin main` or `git push origin dev` directly. Ever.
> 2. Before starting any task, always run `git checkout dev && git pull origin dev`
>    first, then create a new branch: `git checkout -b feature/<short-name>`
>    or `fix/<short-name>` describing the task.
> 3. Commit your work on that branch as you go, with clear Conventional
>    Commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:` — see
>    Phase 3 Implementation Setup doc, Section 1.3).
> 4. When the task is complete and tested locally, push the feature branch
>    only: `git push -u origin feature/<short-name>`
> 5. Do NOT open or merge the pull request yourself. Report back to Oray
>    (or Claude, via the usual status-report channel) that the branch is
>    ready for review, with a summary of what changed and how it was tested.
> 6. If at any point you are unsure whether a change is safe, small, or
>    reversible — stop and ask, rather than pushing directly to any shared
>    branch "to save time."
> 7. Never force-push to any branch except your own feature branch, and only
>    if you are certain no one else is using it.

---

## 7. Reconciling Local vs. Remote Work (Your Specific Situation)

You described working **locally first via Freebuff CLI** when on your Linux
machine, but **fully remotely** when away from it. Here is how that stays
consistent under this model:

- **Local session (Freebuff CLI on Linux machine):**
  Follow the full workflow in Section 2 exactly as written — you have full
  control of the local repo, so create the feature branch locally, commit
  locally, then push only the feature branch.

- **Remote session (away from your Linux machine):**
  The exact same rules apply — a remote agent session should still create a
  feature branch on GitHub (or via the agent's git tooling) rather than
  committing to `dev`/`main` directly. The only difference is *where* the
  commands run, not *what* they do.

- **The risk you're naming — "local repos stay behind remote":**
  This happens when you commit locally, forget to push, then later do remote
  work that also commits and pushes, creating two diverging histories. The
  fix is a habit, not a tool: **always start any new work session — local or
  remote — with `git checkout dev && git pull origin dev` before branching
  off.** This is already Step 1 of the standard workflow above; it is written
  there specifically to prevent this exact problem.

---

## 8. Summary Checklist (Pin This Somewhere Visible)

- [ ] Branch protection enabled on `main` (Section 5) — do this first, today
- [ ] `NEON_API_KEY` secret and `NEON_PROJECT_ID` variable set in GitHub
- [ ] `.github/workflows/neon_workflow.yml` updated with the migration step
- [ ] `.agents/GIT_RULES.md` (or equivalent) added so Freebuff reads Section 6
- [ ] Every new feature = new branch, off `dev`, never off `main`
- [ ] Every merge to `main` gets tagged (`git tag -a vX.Y.Z`)
- [ ] Always `git pull origin dev` before creating a new branch, local or remote
