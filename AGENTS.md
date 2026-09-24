# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Start here: PROJECT_GUIDE.md

`PROJECT_GUIDE.md` at the repository root is the index to this app's briefing —
what it is, the stack, the directory map, and the standing rules. **Read it
before your first edit in a session.**

It is short on purpose. The detailed parts live in `docs/` and are listed in §0
of the guide. **Read only the part your task touches.**

# Work from the map, not from a sweep

1. **`docs/FEATURE-MAP.md` names the files behind every screen, editor, action
   and admin page.** Find the feature there and open only the files it names.
   Do not rediscover the layout with repo-wide Glob/Grep sweeps.
2. **Read ranges, not whole files.** `grep -n` the symbol, then read around it.
   The feature map ends with the files over 400 lines.
3. **One feature per session.** Finish, verify, then start fresh.

# Which skill for which task

Active skills live in `.claude/skills/` (Claude Code) and `.agents/skills/`
(other agents). Pick from this table; one or two skills per task is the norm.

| Task | Skill |
|---|---|
| Bug fix or small behavior change | `surgical-patch`; `investigate-first` when the cause is unknown |
| New feature or new screen | `lean-build`; plus `ui-ux-pro-max` for UI and `transitions-dev` if it animates |
| Animation / transition work | `transitions-dev` for CSS transitions (matches the motion tokens in `globals.css`); `motion` for Framer Motion / `motion/react` code, scroll effects, and jank checks (uses the `motion` MCP server in `.mcp.json` for live docs) |
| Refactor or splitting a large file (e.g. the big `*Editor.tsx` files) | `safe-refactor` |
| Changing a Firestore data shape or `wedding-content.json` structure, dependency upgrade | `migration` |
| Checking finished work | `verify-and-stop`; `caveman-review` for a diff review |
| Stress-testing a plan | `grilling` |
| Ending a session mid-work | `handoff` |
| Merge conflict | `resolving-merge-conflicts` |
| Commit message | `caveman-commit` |
| Security audit | built-in `/security-review`; the Strix skills only on request, **never against the production URL** |
| Saving tokens | `caveman`, `caveman-explore`, `caveman-compress` (`caveman-help` lists them) |

# Keep the guide accurate

Any change that adds or alters a screen, an editable field, a Firestore
collection or field, an admin page, a server action, a shared component, or a
convention must update the matching file in `docs/` **in the same change**. The
closing section of `PROJECT_GUIDE.md` says which file to touch. A guide that
has drifted is worse than none, because the next session will trust it.
