# Ollama with Llama 3.1 8B baked in — ship a ready-to-run local LLM.
#
# Build:  docker build -t ollama-llama31:workshop .
# Run:    docker run -d -p 11434:11434 ollama-llama31:workshop
#
# The model is pulled at BUILD time (not first run), so the resulting image
# (~5 GB) starts serving llama3.1:8b immediately with no download for students.
FROM ollama/ollama:latest

ARG MODEL=llama3.1:8b

# Start the server, wait for it, pull the model, stop the server.
# The model lands in /root/.ollama and is committed into the image layer.
RUN bash -c '\
    ollama serve & pid=$!; \
    until ollama ls >/dev/null 2>&1; do sleep 1; done; \
    ollama pull '"$MODEL"'; \
    kill $pid; wait $pid 2>/dev/null || true'

# Inherit the base image ENTRYPOINT (`ollama`) + CMD (`serve`); exposes 11434.
