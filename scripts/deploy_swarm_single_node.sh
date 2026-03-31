#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/deploy_swarm_single_node.sh [TAG] [STACK_NAME]
# Example:
#   bash scripts/deploy_swarm_single_node.sh 2026-03-30-01 dashboard-marketing

TAG="${1:-$(date -u +%Y-%m-%d-%H%M)}"
STACK_NAME="${2:-dashboard-marketing}"
IMAGE="dashboard-marketing:${TAG}"

if [[ ! -f .env.production ]]; then
  echo "[ERRO] Arquivo .env.production não encontrado no diretório atual: $(pwd)"
  exit 1
fi

if [[ ! -f docker-stack.swarm.yml ]]; then
  echo "[ERRO] Arquivo docker-stack.swarm.yml não encontrado no diretório atual: $(pwd)"
  exit 1
fi

echo "[1/6] Carregando variáveis de ambiente de .env.production"
set -a
source .env.production
set +a

for required in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY APP_URL APP_DOMAIN; do
  if [[ -z "${!required:-}" ]]; then
    echo "[ERRO] Variável obrigatória ausente: ${required}"
    exit 1
  fi
done

echo "[2/6] Build da imagem local: ${IMAGE}"
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -t "$IMAGE" .

echo "[3/6] Exportando variáveis para deploy"
export APP_IMAGE="$IMAGE"
export STACK_NAME

echo "[4/6] Deploy da stack: ${STACK_NAME}"
docker stack deploy -c docker-stack.swarm.yml "$STACK_NAME"

echo "[5/6] Verificando status do serviço"
docker stack services "$STACK_NAME"
docker service ps "${STACK_NAME}_app" --no-trunc

echo "[6/6] Logs recentes"
docker service logs "${STACK_NAME}_app" --tail 50

echo "\n[OK] Deploy concluído."
echo "Teste externo: curl -I https://${APP_DOMAIN}/api/health"
