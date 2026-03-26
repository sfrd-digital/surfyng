#!/bin/bash
# setup-vps.sh — Configuração inicial do VPS Hostinger para o Surfyng API
# Execute UMA VEZ como root: bash setup-vps.sh
# Testado em: Ubuntu 22.04 LTS

set -euo pipefail

DEPLOY_USER="surfyng"
APP_DIR="/var/www/surfyng/backend"
DB_NAME="surfyng_db"
DB_USER="surfyng"

echo "========================================"
echo " Surfyng VPS Setup"
echo "========================================"

# ── 1. Atualiza o sistema ─────────────────────────────────────────────────────
echo "[1/9] Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Instala dependências base ──────────────────────────────────────────────
echo "[2/9] Instalando dependências..."
apt-get install -y -qq curl git ufw nginx certbot python3-certbot-nginx

# ── 3. Instala Node.js 20 LTS via NodeSource ─────────────────────────────────
echo "[3/9] Instalando Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs
node -v && npm -v

# Instala PM2 globalmente
npm install -g pm2 --silent
pm2 startup systemd -u root --hp /root

# ── 4. Instala PostgreSQL 16 ──────────────────────────────────────────────────
echo "[4/9] Instalando PostgreSQL 16..."
apt-get install -y -qq postgresql postgresql-contrib

systemctl enable postgresql
systemctl start postgresql

# Cria banco e usuário (pede senha interativamente)
echo ""
echo ">>> Defina a senha do usuário PostgreSQL '$DB_USER':"
read -s -r DB_PASSWORD
echo ""

sudo -u postgres psql <<SQL
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

echo "[DB] Banco '$DB_NAME' e usuário '$DB_USER' criados."

# ── 5. Instala Redis ──────────────────────────────────────────────────────────
echo "[5/9] Instalando Redis..."
apt-get install -y -qq redis-server

# Configura Redis para ouvir apenas localhost (segurança)
sed -i 's/^bind .*/bind 127.0.0.1/' /etc/redis/redis.conf
sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

systemctl enable redis-server
systemctl restart redis-server
echo "[Redis] Redis configurado e rodando."

# ── 6. Cria usuário e diretório de deploy ─────────────────────────────────────
echo "[6/9] Criando usuário de deploy e diretório..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$DEPLOY_USER"
  echo "Usuário '$DEPLOY_USER' criado."
fi

mkdir -p "$APP_DIR" "$APP_DIR/logs"
chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/www/surfyng

# ── 7. Configura o Firewall ───────────────────────────────────────────────────
echo "[7/9] Configurando firewall (ufw)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo "[UFW] Firewall ativado."

# ── 8. Configura nginx ────────────────────────────────────────────────────────
echo "[8/9] Configurando nginx..."
rm -f /etc/nginx/sites-enabled/default

echo ">>> Qual o domínio da API? (ex: api.surfyng.app)"
read -r DOMAIN

cp /var/www/surfyng/backend/nginx/surfyng.conf /etc/nginx/sites-available/surfyng
sed -i "s/api\.surfyng\.app/$DOMAIN/g" /etc/nginx/sites-available/surfyng
ln -sf /etc/nginx/sites-available/surfyng /etc/nginx/sites-enabled/surfyng

nginx -t && systemctl reload nginx
echo "[Nginx] Nginx configurado para $DOMAIN."

# ── 9. Emite certificado SSL com Certbot ─────────────────────────────────────
echo "[9/9] Emitindo certificado SSL..."
echo ">>> E-mail para o Certbot (notificações de renovação):"
read -r CERTBOT_EMAIL

certbot --nginx -d "$DOMAIN" --email "$CERTBOT_EMAIL" --agree-tos --non-interactive
systemctl enable certbot.timer

echo ""
echo "========================================"
echo " Setup concluído!"
echo ""
echo " Próximos passos:"
echo "  1. Faça clone do repositório em $APP_DIR"
echo "  2. Copie .env.example para .env e preencha"
echo "  3. Execute: bash scripts/deploy.sh"
echo "========================================"
