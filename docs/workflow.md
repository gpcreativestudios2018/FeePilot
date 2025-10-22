# Coding Workflow – ChatGPT × GitHub × Vercel

## How this works in practice
1. In this project chat, enable **GitHub** and **Vercel**.
2. Tell ChatGPT:
3. Describe the feature precisely (requirements, constraints, test IDs, perf/a11y targets).
4. ChatGPT will fetch or ask for files, then return either:
   - a **unified diff** to apply, or
   - full **replacement files**.
5. You push → say “check latest deploy” and ChatGPT will use **Vercel** to confirm status or fetch build logs and iterate.

## Best practices
- Keep chats **scoped** (one feature per chat).
- Prefer **minimal diffs** over whole files.
- Ask for patches: “Return a **unified diff**; keep existing test IDs; avoid unrelated reformatting.”
- Include **tests** or request them with each change.

## Kick-off block (paste at top of a new coding chat)
