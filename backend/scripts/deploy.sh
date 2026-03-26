#!/bin/bash
# deploy.sh — Deploy do Surfyng API no VPS
# Execute a partir do diretório raiz do backend: bash scripts/deploy.sh

set -euo pipefail

APP_DIR="/var/www/surfyng/backend"
ENV_FILE="$APP_DIR/.env"

echo "========================================"
echo " Surfyng Deploy — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ── Validações ────────────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "[ERRO] Arquivo .env não encontrado em $ENV_FILE"
  echo "       Copie .env.example para .env e preencha as variáveis."
  exit 1
fi

# ── 1. Atualiza o código ──────────────────────────────────────────────────────
echo "[1/5] Atualizando código..."
cd "$APP_DIR"
git pull origin main

# ── 2. Instala dependências (somente produção) ────────────────────────────────
echo "[2/5] Instalando dependências..."
npm ci --omit=dev --silent

# Instala devDependencies só para o build (typescript)
npm install --save-dev typescript @types/node --silent

# ── 3. Compila TypeScript ─────────────────────────────────────────────────────
echo "[3/5] Compilando TypeScript..."
npm run build

# Remove devDependencies após o build
npm prune --omit=dev --silent

# ── 4. Executa migrations ─────────────────────────────────────────────────────
echo "[4/5] Executando migrations..."
source "$ENV_FILE"
psql "$DATABASE_URL" -f migrations/001_create_tables.sql

# ── 5. Reinicia o PM2 ────────────────────────────────────────────────────────
echo "[5/5] Reiniciando servidor via PM2..."
if pm2 list | grep -q "surfyng-api"; then
  pm2 reload ecosystem.config.js --update-env
else
  # Primeira vez — inicia e salva a lista de processos
  mkdir -p logs
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

echo ""
echo "========================================"
echo " Deploy concluído!"
pm2 list
echo ""
echo " Logs em tempo real: pm2 logs surfyng-api"
echo " Status:             pm2 monit"
echo "========================================"
