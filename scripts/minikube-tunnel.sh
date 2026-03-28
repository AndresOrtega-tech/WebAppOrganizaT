#!/usr/bin/env bash
set -euo pipefail

echo "==> Arrancando Minikube..."
minikube start

echo "==> Estado de pods:"
kubectl get pods -o wide

echo ""
echo "==> Levantando port-forward en http://127.0.0.1:3001 ..."
echo "    (Ctrl+C para detener)"
kubectl port-forward svc/organizat-frontend 3001:80
