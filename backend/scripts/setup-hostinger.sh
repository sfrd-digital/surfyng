#!/bin/bash
# setup-hostinger.sh — Configura o VPS Hostinger Ubuntu 22.04 do zero para o Surfyng
# Execute UMA VEZ como root: bash setup-hostinger.sh
# Testado em: Ubuntu 22.04 LTS

set -euo pipefail

# ─── Variáveis ────────────────────────────────────────────────────────────────
DEPLOY_USER="surfyng"
APP_DIR="/var/www/surfyng/backend"
DB_NAME="surfyng_db"
DB_USER="surfyng_user"
NODE_VERSION="20"
PG_VERSION="15"

VERDE='\033[0;32m'
AMARELO='\033[1;33m'
NC='\033[0m' # sem cor

ok()  { echo -e "${VERDE}[OK]${NC} $1"; }
msg() { echo -e "${AMARELO}[>>]${NC} $1"; }

echo "========================================"
echo "  Surfyng — Setup VPS Hostinger"
echo "  Ubuntu 22.04 | Node $NODE_VERSION | PG $PG_VERSION | Redis 7"
echo "========================================"
echo ""

# ─── 1. Atualiza o sistema ────────────────────────────────────────────────────
msg "[1/9] Atualizando pacotes do sistema..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget gnupg2 ca-certificates lsb-release \
    software-properties-common apt-transport-https git ufw
ok "Sistema atualizado."

# ─── 2. Node.js 20 LTS via NodeSource ────────────────────────────────────────
msg "[2/9] Instalando Node.js $NODE_VERSION LTS..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - >/dev/null 2>&1
apt-get install -y -qq nodejs
NODE_ATUAL=$(node -v)
NPM_ATUAL=$(npm -v)
ok "Node.js $NODE_ATUAL e npm $NPM_ATUAL instalados."

# PM2 global
npm install -g pm2 --silent
pm2 startup systemd -u root --hp /root | tail -1 | bash || true
ok "PM2 instalado e configurado no systemd."

# ─── 3. PostgreSQL 15 via repositório oficial ─────────────────────────────────
msg "[3/9] Instalando PostgreSQL $PG_VERSION..."

# Repositório oficial do PostgreSQL (garante versão exata)
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg

echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] \
https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
    > /etc/apt/sources.list.d/pgdg.list

apt-get update -qq
apt-get install -y -qq postgresql-${PG_VERSION} postgresql-client-${PG_VERSION}

systemctl enable postgresql
systemctl start postgresql
ok "PostgreSQL $PG_VERSION instalado e rodando."

# Cria banco e usuário
echo ""
echo ">>> Defina a senha do usuário PostgreSQL '$DB_USER':"
read -s -r DB_PASSWORD
echo ""

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;
CREATE DATABASE IF NOT EXISTS $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL
ok "Banco '$DB_NAME' e usuário '$DB_USER' prontos."

# Salva DATABASE_URL para uso posterior
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

# ─── 4. Redis 7 via PPA oficial ───────────────────────────────────────────────
msg "[4/9] Instalando Redis 7..."

curl -fsSL https://packages.redis.io/gpg \
    | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] \
https://packages.redis.io/deb $(lsb_release -cs) main" \
    > /etc/apt/sources.list.d/redis.list

apt-get update -qq
apt-get install -y -qq redis

# Configura Redis para ouvir apenas localhost e limitar memória
sed -i 's/^bind .*/bind 127.0.0.1 -::1/' /etc/redis/redis.conf
sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

systemctl enable redis-server
systemctl restart redis-server
REDIS_VER=$(redis-server --version | awk '{print $3}' | cut -d= -f2)
ok "Redis $REDIS_VER instalado e rodando (somente localhost)."

# ─── 5. Nginx + Certbot ───────────────────────────────────────────────────────
msg "[5/9] Instalando Nginx e Certbot..."
apt-get install -y -qq nginx certbot python3-certbot-nginx
systemctl enable nginx
systemctl start nginx
ok "Nginx e Certbot instalados."

# ─── 6. Usuário de deploy + diretórios ───────────────────────────────────────
msg "[6/9] Criando usuário '$DEPLOY_USER' e diretórios..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    ok "Usuário '$DEPLOY_USER' criado."
else
    ok "Usuário '$DEPLOY_USER' já existe."
fi

mkdir -p "$APP_DIR/logs"
chown -R "$DEPLOY_USER:$DEPLOY_USER" /var/www/surfyng
ok "Diretório $APP_DIR pronto."

# ─── 7. Firewall UFW ─────────────────────────────────────────────────────────
msg "[7/9] Configurando firewall UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ok "Firewall ativado: SSH + HTTP/HTTPS liberados."

# ─── 8. Nginx — configura o domínio ──────────────────────────────────────────
msg "[8/9] Configurando Nginx..."
echo ""
echo ">>> Qual o domínio da API? (ex: api.surfyng.app)"
read -r DOMAIN

# Remove o site padrão do Nginx
rm -f /etc/nginx/sites-enabled/default

# Copia o arquivo de configuração do repositório (já deve estar clonado ou copia temporária)
if [ -f "$APP_DIR/nginx/surfyng.conf" ]; then
    cp "$APP_DIR/nginx/surfyng.conf" /etc/nginx/sites-available/surfyng
else
    # Cria configuração mínima HTTP para o Certbot funcionar antes do clone
    cat > /etc/nginx/sites-available/surfyng <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://\$host\$request_uri; }
}
NGINX
fi

sed -i "s/api\.surfyng\.app/$DOMAIN/g" /etc/nginx/sites-available/surfyng
ln -sf /etc/nginx/sites-available/surfyng /etc/nginx/sites-enabled/surfyng

nginx -t
systemctl reload nginx
ok "Nginx configurado para $DOMAIN."

# ─── 9. Certificado SSL — Let's Encrypt via Certbot ──────────────────────────
msg "[9/9] Emitindo certificado SSL..."
echo ""
echo ">>> E-mail para notificações do Certbot (renovação, expiração):"
read -r CERTBOT_EMAIL

mkdir -p /var/www/certbot
certbot --nginx \
    -d "$DOMAIN" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect

# Renovação automática — cron já criado pelo certbot, mas garante o timer systemd
systemctl enable certbot.timer
ok "Certificado SSL emitido para $DOMAIN. Renovação automática ativada."

# ─── Conclusão ────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo -e "  ${VERDE}Setup concluído com sucesso!${NC}"
echo ""
echo "  Próximos passos:"
echo "  ─────────────────────────────────────"
echo "  1. Clone o repositório:"
echo "     git clone <repo-url> $APP_DIR"
echo ""
echo "  2. Crie o arquivo .env:"
echo "     cp $APP_DIR/.env.example $APP_DIR/.env"
echo "     nano $APP_DIR/.env   # preencha todas as variáveis"
echo ""
echo "  3. Execute o deploy:"
echo "     cd $APP_DIR && bash scripts/deploy.sh"
echo ""
echo "  4. Configure o DNS:"
echo "     Registro A: $DOMAIN → $(curl -s ifconfig.me 2>/dev/null || echo '<IP do VPS>')"
echo ""
echo "  DATABASE_URL (para referência):"
echo "  $DATABASE_URL"
echo "========================================"
