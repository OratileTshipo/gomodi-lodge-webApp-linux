# Git rules for this project — follow exactly, no exceptions

> These rules come from the repo's `GIT_WORKFLOW_GUIDELINES.md` (Section 6) and
> bind every human and every coding agent (Freebuff, ZCode, etc.).

1. Never run `git push origin main` or `git push origin dev` directly. Ever.
2. Before starting any task, always run `git checkout dev && git pull origin dev`
   first, then create a new branch: `git checkout -b feature/<short-name>`
   or `fix/<short-name>` describing the task.
3. Commit your work on that branch as you go, with clear Conventional
   Commit messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
4. When the task is complete and tested locally, push the feature branch
   only: `git push -u origin feature/<short-name>`.
5. Do NOT open or merge the pull request yourself. Report back to Oray
   that the branch is ready for review, with a summary of what changed and
   how it was tested. The owner reviews the PR into `dev` (which deploys a
   Vercel preview), and only after the owner approves is it promoted to
   `main` (production).
6. If at any point you are unsure whether a change is safe, small, or
   reversible — stop and ask, rather than pushing directly to any shared
   branch "to save time."
7. Never force-push to any branch except your own feature branch, and only
   if you are certain no one else is using it.
