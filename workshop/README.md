# Workshop branch tooling

Generates the **cumulative per-chapter participant branches** for the
"Rise of the Web Agents" workshop.

## Branches produced

`start/ch1`, `start/ch2`, `start/ch3`, `start/ch4`, `start/ch4.1`, `start/ch5`,
`start/ch6`, `start/ch7`.

A participant joining at chapter *N* checks out `start/chN`. On that branch:

- Chapters **before** *N* are the complete reference implementations (nobody is blocked).
- Chapter *N* and everything after it are **stubbed** — typed skeletons (imports, types,
  signatures preserved) with `throw new Error('TODO: ...')` bodies and the chapter's
  `WORKSHOP TASKS` assignment comments retained. Participants implement them live.
- `SOLUTIONS.md` is absent (worked answers stay hidden).

`main` and `solutions` are the instructor references:
- `main` — all teaching code complete, tasks as comments, no solutions doc.
- `solutions` — `main` + `SOLUTIONS.md` (worked answers for every task).

## How it works

- `stubs/<chapter-dir>/<file>` — committed stub sources, the single source of truth.
  Each stub starts with `// @ts-nocheck` so every generated branch passes
  `npx tsc --noEmit -p tsconfig.examples.json` even while bodies are unimplemented.
- `build-branches.sh` — for each checkpoint, branches off `main`, copies stubs for that
  chapter onward over `examples/`, removes `SOLUTIONS.md` and this `workshop/` dir, commits.

Chapter 6 has no stubs: its material is the `.claude/skills/` tooling that participants use
in *every* chapter, so those skills stay intact; only `SOLUTIONS.md` removal hides its answers.

## Regenerate

```bash
# from repo root, on main, with workshop/ committed
bash workshop/build-branches.sh            # build locally
PUSH=1 bash workshop/build-branches.sh     # build and push to origin (force-with-lease)
```

Idempotent — re-running force-updates the branches. To add/adjust a chapter's exercise,
edit the files under `stubs/` and re-run.
