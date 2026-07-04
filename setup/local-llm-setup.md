# Local LLM setup — Ollama + DeepSeek-R1 + Continue (VS Code)

A **free, no-API-key** local model that powers the entire workshop. Use this if you
don't want to spend on the Anthropic API — Ollama serves `deepseek-r1:8b` on your machine, and one
model drives **two** things:

1. the **Continue** VS Code extension — an inline chat/edit assistant for the coding exercises, and
2. the workshop's **runnable agent examples** (Ch4, Ch4.1, Ch5, Ch7), which talk to the same Ollama
   server through the shared `examples/shared/ollama.ts` module — no API key.

Both point at the same Ollama endpoint on port **11434**, so setting up Ollama once covers everything.

> **DeepSeek-R1 is a reasoning model.** Its raw output is wrapped in `<think>…</think>` blocks: in
> Continue chat you'll see this as visible "thinking" before the answer, and the code examples strip
> it automatically in `examples/shared/ollama.ts`. DeepSeek-R1 also lacks native Ollama tool-calling,
> so the agent examples drive it with a prompt-based JSON action protocol instead of function calls.

> Two ways to get there:
> - **Option A — Local install** (below): each participant installs Ollama + pulls the model.
> - **Option B — Docker** ([§ Docker](#option-b--docker-no-local-install)): ship a preconfigured image so nobody installs anything.
> - **Option C — Dev container** ([§ zero-prereq](#option-c--zero-prerequisites-dev-container)): VS Code opens the repo with the model *and* Continue already wired up.

---

## Hardware check (read first)

`deepseek-r1:8b` is ~5 GB to download and needs roughly:

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

### 2. Download DeepSeek-R1
```bash
ollama pull deepseek-r1:8b
```
Confirm it's a quick terminal chat before touching VS Code:
```bash
ollama run deepseek-r1:8b "In one sentence, what is a Playwright locator?"
```
You should get a coherent answer (possibly preceded by a `<think>…</think>` reasoning block — that's
normal for DeepSeek-R1). Type `/bye` to exit.

### 3. Install the Continue extension
1. In VS Code open **Extensions** (`Cmd/Ctrl+Shift+X`).
2. Search **Continue** (publisher `Continue`, id `Continue.continue`) → **Install**.
3. A Continue icon appears in the left sidebar.

### 4. Point Continue at your local model
Create/edit **`~/.continue/config.yaml`** (Continue's current config format):

```yaml
name: Local DeepSeek-R1
version: 0.0.1
schema: v1
models:
  - name: DeepSeek-R1 8B
    provider: ollama
    model: deepseek-r1:8b
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
    { "title": "DeepSeek-R1 8B", "provider": "ollama", "model": "deepseek-r1:8b" }
  ]
}
```
</details>

Save it — Continue hot-reloads. Full reference: <https://docs.continue.dev>.

---

## Verify it works — example chat

1. Open the **Continue** sidebar (`Cmd/Ctrl+L`).
2. Make sure **DeepSeek-R1 8B** is selected in the model dropdown at the bottom of the input box.
3. Paste this prompt:

   > Write a Playwright test in TypeScript that logs into `http://localhost:5173/login`
   > with email `admin@shop.com` and password `password123`, then asserts the URL
   > contains `/dashboard`. Use ARIA locators (`getByLabel`, `getByRole`), no CSS selectors.

**Expected result:** after a short `<think>…</think>` reasoning pass, you get a fenced ```ts block using
`page.goto(...)`, `page.getByLabel('Email address').fill(...)`, `page.getByRole('button', { name: 'Sign In' }).click()`,
and `expect(page).toHaveURL(/\/dashboard/)`. That confirms the whole chain — Ollama serving, the
model loaded, and Continue talking to it — is working.

Bonus check of the **edit** role: open any `.spec.ts`, select a block, press `Cmd/Ctrl+I`, and ask
"convert these CSS selectors to ARIA locators." Continue should propose an inline diff.

> Local DeepSeek-R1 is capable but a small local model: on the agentic chapters (Ch5/Ch7) it is
> less reliable than a frontier cloud model at sticking to the strict JSON action protocol. It's
> great for the coding/chat exercises; for the agent examples, expect more retries and the occasional
> malformed action. If a chapter struggles, try a stronger local model via `WORKSHOP_MODEL`
> (e.g. `qwen2.5-coder:7b`).

---

## Running the code examples against this model

The workshop's agent chapters (Ch4, Ch4.1, Ch5, Ch7) use the same local model — no API key. Just make
sure Ollama is up and the model is pulled, then run any example:

```bash
ollama serve                       # if not already running as a service
ollama pull deepseek-r1:8b         # once
npx ts-node examples/ch5-custom-agent/agent.ts
```

The examples reach Ollama on `http://localhost:11434` via `examples/shared/ollama.ts`, which also
strips the `<think>…</think>` reasoning wrapper before parsing the model's JSON actions. To try a
different model, set `WORKSHOP_MODEL` (defaults to `deepseek-r1:8b`):

```bash
WORKSHOP_MODEL=llama3.2:3b npx ts-node examples/ch5-custom-agent/agent.ts
```

---

## Option B — Docker (no local install)

Ship an image that **already contains** Ollama and the model, so participants only run a container.
Files live in [`setup/ollama-docker/`](./ollama-docker/).

### Build the image (model baked in at build time)
```bash
cd setup/ollama-docker
docker build -t ollama-deepseek-r1:workshop .      # ~5 GB image; model pulled during build
```

### Run it
```bash
docker run -d --name ollama-workshop -p 11434:11434 ollama-deepseek-r1:workshop
# or, from setup/ollama-docker:
docker compose up -d
```
The model is served on `http://localhost:11434` — the **same port Continue defaults to**, so the
Option A `config.yaml` works unchanged. Test:
```bash
curl http://localhost:11434/api/tags        # should list deepseek-r1:8b
```

### Share it with students (zero download of the model on their side)
Push once to a registry, students pull:
```bash
# You (once):
docker tag ollama-deepseek-r1:workshop ghcr.io/gpap84/ollama-deepseek-r1:workshop
docker push ghcr.io/gpap84/ollama-deepseek-r1:workshop

# Each participant:
docker run -d -p 11434:11434 ghcr.io/gpap84/ollama-deepseek-r1:workshop
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
| Continue shows no models / "No model selected" | Check `~/.continue/config.yaml` exists and the model name matches `ollama list` output exactly (`deepseek-r1:8b`). |
| Continue chats but replies are empty/errors | Model name mismatch, or Ollama pointing at a different port — confirm `apiBase`. |
| Very slow responses | You're on CPU. Use a GPU, or switch to `llama3.2:3b`. |
| Out of memory / crash | Model too big for RAM — use `llama3.2:3b` or `qwen2.5-coder:3b`. |
| Docker image huge / slow to share | Don't bake the model — use the official `ollama/ollama` image + a named volume and `ollama pull` on first run (one-time download per participant). |
