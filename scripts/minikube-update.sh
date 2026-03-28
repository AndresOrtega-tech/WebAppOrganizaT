#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-dev-$(date +%s)}"

echo "==> Apuntando Docker al daemon de Minikube..."
eval $(minikube docker-env)

echo "==> Construyendo imagen organizat-frontend:${TAG}..."
docker build -t "organizat-frontend:${TAG}" -f Dockerfile .

echo "==> Desplegando con Helm (tag=${TAG})..."
helm upgrade organizat-frontend helm/organizat-frontend \
  -f helm/organizat-frontend/values-dev.yaml \
  --set "image.tag=${TAG}" \
  --set "env.GEMINI_API_KEY=${GEMINI_API_KEY:-}"

echo "==> Esperando rollout..."
kubectl rollout status deploy/organizat-frontend --timeout=90s

echo "==> Listo. Matando port-forward viejo..."
lsof -ti tcp:3001 | xargs kill 2>/dev/null || true
sleep 1

echo "==> Levantando port-forward en http://127.0.0.1:3001 ..."
kubectl port-forward svc/organizat-frontend 3001:80
