# Local LLM setup — Ollama + Llama 3.1 + Continue (VS Code)

A **free, no-API-key** coding assistant that runs entirely on your machine. Use this if you
don't want to spend on the Anthropic API for the workshop — Ollama serves a local model and the
**Continue** VS Code extension turns it into an inline chat/edit assistant.

> Two ways to get there:
> - **Option A — Local install** (below): each participant installs Ollama + pulls the model.
> - **Option B — Docker** ([§ Docker](#option-b--docker-no-local-install)): ship a preconfigured image so nobody installs anything.
> - **Option C — Dev container** ([§ zero-prereq](#option-c--zero-prerequisites-dev-container)): VS Code opens the repo with the model *and* Continue already wired up.

---

## Hardware check (read first)

`llama3.1:8b` is ~4.7 GB to download and needs roughly:

| RAM | Experience |
|-----|-----------|
| 8 GB | Works, slowish on CPU |
| 16 GB+ | Comfortable |
| Any NVIDIA/Apple-Silicon GPU | Much faster (Ollama uses it automatically) |

If your machine is below 8 GB, use `llama3.2:3b` instead (swap the model name everywhere below).

---

## Option A — Local install

### 1. Install Ollama

**macOS**
```bash
brew install ollama        # or download the app from https://ollama.com/download
```
The Homebrew install runs as a background service. If you used the downloaded app, launch it once.

**Linux**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows** — download and run the installer from <https://ollama.com/download> (installs a tray app that auto-starts the server).

Verify the server is up (it listens on port **11434**):
```bash
curl http://localhost:11434/api/tags     # → {"models":[...]}  (empty list is fine)
```
If that connection is refused, start it manually with `ollama serve` in a spare terminal.

### 2. Download Llama 3.1
```bash
ollama pull llama3.1:8b
```
Confirm it's a quick terminal chat before touching VS Code:
```bash
ollama run llama3.1:8b "In one sentence, what is a Playwright locator?"
```
You should get a coherent one-line answer. Type `/bye` to exit.

### 3. Install the Continue extension
1. In VS Code open **Extensions** (`Cmd/Ctrl+Shift+X`).
2. Search **Continue** (publisher `Continue`, id `Continue.continue`) → **Install**.
3. A Continue icon appears in the left sidebar.

### 4. Point Continue at your local model
Create/edit **`~/.continue/config.yaml`** (Continue's current config format):

```yaml
name: Local Llama 3.1
version: 0.0.1
schema: v1
models:
  - name: Llama 3.1 8B
    provider: ollama
    model: llama3.1:8b
    # apiBase defaults to http://localhost:11434 — only set it for a remote/Docker Ollama:
    # apiBase: http://localhost:11434
    roles:
      - chat
      - edit
      - apply
```

<details>
<summary>Using an older Continue version? (<code>config.json</code>)</summary>

```json
{
  "models": [
    { "title": "Llama 3.1 8B", "provider": "ollama", "model": "llama3.1:8b" }
  ]
}
```
</details>

Save it — Continue hot-reloads. Full reference: <https://docs.continue.dev>.

---

## Verify it works — example chat

1. Open the **Continue** sidebar (`Cmd/Ctrl+L`).
2. Make sure **Llama 3.1 8B** is selected in the model dropdown at the bottom of the input box.
3. Paste this prompt:

   > Write a Playwright test in TypeScript that logs into `http://localhost:5173/login`
   > with email `admin@shop.com` and password `password123`, then asserts the URL
   > contains `/dashboard`. Use ARIA locators (`getByLabel`, `getByRole`), no CSS selectors.

**Expected result:** within a few seconds you get a fenced ```ts block using
`page.goto(...)`, `page.getByLabel('Email address').fill(...)`, `page.getByRole('button', { name: 'Sign In' }).click()`,
and `expect(page).toHaveURL(/\/dashboard/)`. That confirms the whole chain — Ollama serving, the
model loaded, and Continue talking to it — is working.

Bonus check of the **edit** role: open any `.spec.ts`, select a block, press `Cmd/Ctrl+I`, and ask
"convert these CSS selectors to ARIA locators." Continue should propose an inline diff.

> Local Llama 3.1 is capable but noticeably less accurate than Claude on the agentic chapters
> (Ch5/Ch7). It's great for the coding/chat exercises; for the agent examples, expect more
> hand-holding than the `ANTHROPIC_API_KEY` path.

---

## Option B — Docker (no local install)

Ship an image that **already contains** Ollama and the model, so participants only run a container.
Files live in [`setup/ollama-docker/`](./ollama-docker/).

### Build the image (model baked in at build time)
```bash
cd setup/ollama-docker
docker build -t ollama-llama31:workshop .      # ~5 GB image; model pulled during build
```

### Run it
```bash
docker run -d --name ollama-workshop -p 11434:11434 ollama-llama31:workshop
# or, from setup/ollama-docker:
docker compose up -d
```
The model is served on `http://localhost:11434` — the **same port Continue defaults to**, so the
Option A `config.yaml` works unchanged. Test:
```bash
curl http://localhost:11434/api/tags        # should list llama3.1:8b
```

### Share it with students (zero download of the model on their side)
Push once to a registry, students pull:
```bash
# You (once):
docker tag ollama-llama31:workshop ghcr.io/gpap84/ollama-llama31:workshop
docker push ghcr.io/gpap84/ollama-llama31:workshop

# Each participant:
docker run -d -p 11434:11434 ghcr.io/gpap84/ollama-llama31:workshop
```
Then they install Continue (Option A step 3–4) and point it at `localhost:11434`. No Ollama
install, no model download.

> **GPU:** the container runs on CPU by default. For NVIDIA GPUs, install the
> [nvidia-container-toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
> and add `--gpus all` to `docker run` (or uncomment the `deploy` block in `docker-compose.yml`).
> Apple Silicon GPUs are **not** accessible from Docker — on a Mac, Option A (native install) is faster.

---

## Option C — Zero prerequisites (dev container)

The most hands-off path: participants open the repo in VS Code and choose **"Reopen in Container."**
The dev container brings the workspace, the Continue extension, **and** the Ollama service — all
preconfigured. Add this alongside the repo (sample; adjust image/paths to taste):

`.devcontainer/devcontainer.json`
```jsonc
{
  "name": "web-detective + local LLM",
  "dockerComposeFile": "docker-compose.yml",
  "service": "workspace",
  "workspaceFolder": "/workspaces/web-detective",
  "customizations": {
    "vscode": {
      "extensions": ["Continue.continue", "ms-playwright.playwright"]
    }
  },
  // Copy the ready-made Continue config into the container user's home:
  "postCreateCommand": "mkdir -p ~/.continue && cp setup/ollama-docker/continue-config.yaml ~/.continue/config.yaml"
}
```

`.devcontainer/docker-compose.yml`
```yaml
services:
  workspace:
    image: mcr.microsoft.com/devcontainers/typescript-node:20
    volumes:
      - ..:/workspaces/web-detective:cached
    command: sleep infinity
    depends_on:
      - ollama

  ollama:
    build: ../setup/ollama-docker      # the model-baked image from Option B
    ports:
      - "11434:11434"
```

Inside the dev container, Continue reaches the model at **`http://ollama:11434`** (the compose
service name), so set `apiBase: http://ollama:11434` in `continue-config.yaml`. On the host it's
`http://localhost:11434`. Provide two configs, or standardize on the dev-container path.

> This is the "batteries-included" option: `git clone` → *Reopen in Container* → start chatting,
> with nothing installed on the host but Docker + VS Code.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `curl localhost:11434` connection refused | Start the server: `ollama serve` (native) or `docker start ollama-workshop`. |
| Continue shows no models / "No model selected" | Check `~/.continue/config.yaml` exists and the model name matches `ollama list` output exactly (`llama3.1:8b`). |
| Continue chats but replies are empty/errors | Model name mismatch, or Ollama pointing at a different port — confirm `apiBase`. |
| Very slow responses | You're on CPU. Use a GPU, or switch to `llama3.2:3b`. |
| Out of memory / crash | Model too big for RAM — use `llama3.2:3b` or `qwen2.5-coder:3b`. |
| Docker image huge / slow to share | Don't bake the model — use the official `ollama/ollama` image + a named volume and `ollama pull` on first run (one-time download per participant). |
