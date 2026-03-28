#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART_PATH="$ROOT_DIR/helm/organizat-frontend"

if ! command -v minikube >/dev/null 2>&1; then
  echo "minikube no esta instalado"
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl no esta instalado"
  exit 1
fi

if ! command -v helm >/dev/null 2>&1; then
  echo "helm no esta instalado"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker no esta instalado"
  exit 1
fi

echo "[1/6] Iniciando minikube..."
minikube start

echo "[2/6] Habilitando ingress..."
minikube addons enable ingress

echo "[3/6] Usando el docker daemon de minikube..."
eval "$(minikube docker-env)"

echo "[4/6] Construyendo imagen del frontend..."
docker build -t organizat-frontend:dev "$ROOT_DIR"

echo "[5/6] Desplegando frontend con Helm..."
helm upgrade --install organizat-frontend "$CHART_PATH" -f "$CHART_PATH/values-dev.yaml"

echo "[6/6] Estado de recursos"
kubectl get pods,svc,ingress -l app.kubernetes.io/instance=organizat-frontend

echo "Listo. Si no tienes DNS local, agrega este host:"
echo "  $(minikube ip) organizat-frontend.local"