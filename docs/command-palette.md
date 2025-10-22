# Project Command Palette – Vercel + GitHub

## Quick variables (set per chat)

### Vercel – deployments, logs, previews
- List the **last 5 deployments** for `{project}` in `{team}` (state, creator, time, preview URL).
- Show the **build logs** for the **latest deployment** of `{project}` (summarize top error + likely fix).
- If the last deployment failed, **redeploy** it and share the new preview URL.
- Compare the **two most recent deployments** and summarize what changed (commit, author, files).
- Give me the **preview URL** of the latest successful deployment for `{project}`.
- What’s the **production URL** for `{project}`? Confirm it resolves.
- List **environment variables** for `{project}` (mask secrets).
- Check if **`NODE_ENV`** is set in **Production** for `{project}`.

#### Troubleshooting loop
1. Fetch latest deployment logs for `{project}` → summarize errors → propose a **minimal patch**.
2. I’ll paste the file next; return a **unified diff** only.
3. After I push, **check the new deployment** for `{project}` and confirm success or show the first error.

### GitHub – read-only repo help
- Open `{repo}` at `{branch}` and show the **tree of `/`**.
- Open `{repo}` file `src/pages/index.tsx` at `{branch}`.
- Search `{repo}` for usages of `getServerSideProps` (paths + lines).
- Find all **TODO/FIXME** comments in `{repo}`.
- Show the **last 10 commits** on `{branch}` in `{repo}`.
- Diff the **last two commits** on `{branch}` for `{repo}`—summarize changed files.
- Diff `{branch}` against tag `v0.1.0` in `{repo}` and list breaking changes.
- List **open PRs** in `{repo}` (title, author, last update).
- Open PR `#123` in `{repo}` and summarize the diff + CI status.
- Locate all exports of `UserContext` and show where they’re imported.
- Scan `src/` for **unused imports** or **circular deps**; list suspects.

### One-liners tailored to this project
- List the last 5 deployments for **fee-pilot** in team **gp-creative-studios-projects**.
- Show build logs for the latest **fee-pilot** deployment and summarize the failure.
- Redeploy the last failed **fee-pilot** build and give me the preview URL.
- Open `gpcreativestudios2018/fee-pilot` file `src/app/page.tsx` on `main`.
- Diff the last two commits on `main` for `gpcreativestudios2018/fee-pilot` and summarize changes.
- Search `gpcreativestudios2018/fee-pilot` for `listingFixed` references (paths + lines).
