#!/usr/bin/env bash
#
# build-branches.sh — generate cumulative per-chapter participant branches.
#
# For each chapter checkpoint `start/<chapter>` we build a branch off `main` where:
#   • chapters BEFORE this one are left complete (the reference teaching code),
#   • this chapter and every chapter after it are replaced with the stub versions
#     in workshop/stubs/ (typed skeletons + TODOs, so participants build them live),
#   • SOLUTIONS.md is removed (it lives only on the `solutions` branch),
#   • the workshop/ build tooling is removed from the participant branch.
#
# So a participant who joins at chapter N checks out `start/chN`, has everything up
# to N already working, and implements chapter N onward themselves.
#
# This script is idempotent: re-running it force-updates the branches.
# Run it from the repo root, on a clean-ish `main` (only the workshop/ tooling needs
# to be committed). Pre-existing unrelated working-tree changes are NOT committed
# because we stage explicit paths only (never `git add -A`).
#
# Usage:
#   bash workshop/build-branches.sh           # build branches locally
#   PUSH=1 bash workshop/build-branches.sh    # build AND push to origin
#
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BASE_BRANCH="main"
STUB_ROOT="workshop/stubs"
PUSH="${PUSH:-0}"

# Ordered chapter list (CHAPTERS[i] is the branch suffix start/<key>) and the
# matching examples/ subdirectory (CH_DIRS[i]). Parallel indexed arrays are used
# instead of an associative array so this runs on macOS's stock bash 3.2.
# Chapters with no code to stub (e.g. ch6, whose material is the .claude/skills/
# tooling used in every chapter) map to "-" and contribute no stub files.
CHAPTERS=(ch1            ch2                ch3      ch4               ch4.1                    ch5              ch6  ch7)
CH_DIRS=(ch1-foundations ch2-execution-layer ch3-mcp ch4-self-healing ch4.1-playwright-agents ch5-custom-agent -    ch7-agent-ci)

# Verify we are on (or can reach) the base branch and stubs exist.
git rev-parse --verify "$BASE_BRANCH" >/dev/null
[ -d "$STUB_ROOT" ] || { echo "ERROR: $STUB_ROOT not found — run from main with workshop/ committed." >&2; exit 1; }

n=${#CHAPTERS[@]}
for ((i = 0; i < n; i++)); do
  start_ch="${CHAPTERS[$i]}"
  branch="start/${start_ch}"
  echo ""
  echo "=== Building ${branch} (chapters ${start_ch}+ stubbed) ==="

  # Fresh branch from main — resets tracked files to main's complete state.
  git checkout -B "$branch" "$BASE_BRANCH" >/dev/null

  # Stub this chapter and every chapter after it.
  for ((j = i; j < n; j++)); do
    dir="${CH_DIRS[$j]}"
    [ "$dir" = "-" ] && continue
    src="${STUB_ROOT}/${dir}"
    dest="examples/${dir}"
    [ -d "$src" ] || { echo "  (no stubs for ${CHAPTERS[$j]}, skipping)"; continue; }
    cp "$src"/* "$dest"/
    git add "$dest"
    echo "  stubbed examples/${dir}"
  done

  # Hide the worked solutions and the build tooling from participants.
  [ -f SOLUTIONS.md ] && git rm -q SOLUTIONS.md
  git rm -rq workshop

  git commit -q -m "workshop: ${branch} starter — chapters ${start_ch}+ as exercises

Cumulative checkpoint: chapters before ${start_ch} are complete; ${start_ch} onward
are stubbed for participants to implement. SOLUTIONS.md and build tooling removed."
  echo "  committed ${branch}"

  if [ "$PUSH" = "1" ]; then
    git push -u origin "$branch" --force-with-lease
    echo "  pushed ${branch}"
  fi
done

git checkout "$BASE_BRANCH" >/dev/null
echo ""
echo "Done. Built ${n} branches: ${CHAPTERS[*]/#/start/}"
[ "$PUSH" = "1" ] || echo "(local only — re-run with PUSH=1 to push to origin)"
