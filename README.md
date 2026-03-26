# Surfyng

App mobile que recomenda a melhor praia para surfar agora, com base em GPS + condições de vento e ondulação em tempo real.

## Stack

| Camada | Tecnologia |
|---|---|
| App mobile | React Native + Expo SDK 51 + Expo Router |
| Backend | Node.js 20 + Express + TypeScript |
| Banco de dados | PostgreSQL 15 |
| Cache | Redis 7 (condições Windguru — TTL 30 min) |
| Autenticação | Firebase Auth (Google OAuth) |
| Pagamentos | Stripe (app-to-web checkout) |
| Notificações | Expo Push Notifications |
| Deploy | VPS Hostinger Ubuntu 22.04 + PM2 + Nginx |

---

## Pré-requisitos locais

- [Node.js 20 LTS](https://nodejs.org/)
- PostgreSQL 15 rodando localmente
- Redis rodando localmente (`redis-server`)
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo-cli`
- [EAS CLI](https://docs.expo.dev/eas/) (somente para builds de produção): `npm install -g eas-cli`
- Conta no Firebase (para Auth)
- Conta no Stripe (para pagamentos — modo teste funciona)

---

## Rodar o backend localmente

```bash
# 1. Instala dependências
cd backend
npm install

# 2. Cria o arquivo de ambiente
cp .env.example .env
# Edite .env com suas credenciais reais (Firebase, Stripe, etc.)

# 3. Cria as tabelas no banco
npm run migrate

# 4. Insere as 121 praias brasileiras
npm run seed

# 5. Inicia em modo desenvolvimento (hot reload)
npm run dev
# Servidor disponível em http://localhost:3000

# Testa se está rodando
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }
```

### Rodar os testes

```bash
npm test                # todos os testes (unit + integration)
npm run test:watch      # modo interativo
```

---

## Rodar o app mobile localmente

```bash
# 1. Instala dependências
cd mobile
npm install

# 2. Cria o arquivo de ambiente
cp .env.example .env
# Preencha as credenciais Firebase (Web SDK — valores públicos)
```

**Configure a URL da API no `.env` conforme o ambiente:**

| Ambiente | Variável |
|---|---|
| iOS Simulator | `EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1` |
| Android Emulator | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api/v1` |
| Dispositivo físico | `EXPO_PUBLIC_API_URL=http://<IP-DA-MAQUINA>:3000/api/v1` |

```bash
# 3. Inicia o Metro Bundler
npx expo start

# Pressione 'i' para iOS Simulator, 'a' para Android Emulator
# Escaneie o QR code com o app Expo Go no celular físico
```

---

## Deploy no Hostinger VPS

### Requisitos do servidor
- Ubuntu 22.04 LTS
- Mínimo 2 GB RAM (recomendado 4 GB para cluster PM2)
- Domínio apontando para o IP do VPS (ex: `api.surfyng.app`)

### Passo 1 — Configurar o servidor (executar uma única vez como root)

```bash
# Conecte no VPS
ssh root@<IP-DO-VPS>

# Baixe e execute o script de setup
# (ou clone o repo e rode diretamente)
curl -fsSL https://raw.githubusercontent.com/<seu-usuario>/surfyng/main/backend/scripts/setup-hostinger.sh | bash
```

O script instala automaticamente: Node.js 20, PostgreSQL 15, Redis 7, Nginx, PM2 e Certbot (SSL).

### Passo 2 — Clonar o repositório

```bash
su - surfyng
git clone https://github.com/<seu-usuario>/surfyng.git /var/www/surfyng/backend
```

### Passo 3 — Configurar variáveis de ambiente

```bash
cd /var/www/surfyng/backend
cp .env.example .env
nano .env   # preencha todas as variáveis com valores reais de produção
```

> **Atenção:** A `FIREBASE_PRIVATE_KEY` deve ter os `\n` preservados como literais dentro das aspas.

### Passo 4 — Deploy

```bash
cd /var/www/surfyng/backend
bash scripts/deploy.sh
```

O script faz automaticamente:
1. `git pull origin main`
2. `npm ci --omit=dev`
3. `npm run build` (compila TypeScript → `dist/`)
4. `npm run migrate` (cria/atualiza tabelas — idempotente)
5. `pm2 reload` ou `pm2 start` (sem downtime)

### Passo 5 — Verificar

```bash
pm2 status              # processos rodando
pm2 logs surfyng-api    # logs em tempo real
curl https://api.surfyng.app/health
# → { "status": "ok" }
```

### Deploy subsequente (atualização de código)

```bash
# A partir da máquina local
ssh surfyng@<IP-DO-VPS> "cd /var/www/surfyng/backend && bash scripts/deploy.sh"
```

### DNS

Configure um registro `A` no painel do domínio:
```
api.surfyng.app  →  <IP do VPS>   TTL: 300
```

---

## Migrations e seeds

```bash
# Criar/atualizar todas as tabelas (idempotente — seguro rodar várias vezes)
npm run migrate

# Inserir as 121 praias brasileiras
npm run seed

# Executar manualmente com psql
psql $DATABASE_URL -f migrations/001_create_tables.sql
psql $DATABASE_URL -f seeds/beaches_seed.sql
```

**Tabelas criadas pela migration:**
`users`, `beaches`, `conditions_cache`, `favorite_beaches`, `posts`, `post_likes`, `subscriptions`, `alert_preferences`, `notifications`

---

## Build do app Expo para iOS e Android

### Configuração inicial (uma única vez)

```bash
cd mobile

# Login na conta Expo
eas login

# Configura o projeto (cria eas.json)
eas build:configure
```

Crie o arquivo `mobile/eas.json`:

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build de produção

```bash
# Android (.aab para Google Play)
eas build --platform android --profile production

# iOS (.ipa para App Store)
eas build --platform ios --profile production

# Ambos ao mesmo tempo
eas build --platform all --profile production
```

> **Pré-requisitos iOS:** Apple Developer Account ativa ($99/ano). O EAS solicitará as credenciais automaticamente.
>
> **Pré-requisitos Android:** Conta no Google Play Console ($25 taxa única).

### Enviar para as lojas

```bash
# Envia para Google Play (requer google-services.json configurado)
eas submit --platform android

# Envia para App Store Connect
eas submit --platform ios
```

### Build local (sem EAS Cloud — requer Xcode/Android Studio)

```bash
# Gera projeto nativo
npx expo prebuild

# iOS
cd ios && pod install && cd ..
npx expo run:ios --configuration Release

# Android
npx expo run:android --variant release
```

---

## Estrutura do projeto

```
surfyng/
├── backend/                    # API Node.js + Express
│   ├── src/
│   │   ├── app.ts              # Entry point — Express, rotas, cron
│   │   ├── config/
│   │   │   ├── database.ts     # Pool PostgreSQL + helpers query/transaction
│   │   │   ├── firebase.ts     # Firebase Admin SDK
│   │   │   ├── redis.ts        # ioredis + helpers getCache/setCache
│   │   │   └── stripe.ts       # Stripe client
│   │   ├── controllers/        # Handlers HTTP (req → res)
│   │   ├── services/
│   │   │   ├── beachesService.ts   # Score (0-10), roupa, praias próximas
│   │   │   ├── windguruService.ts  # Fetch condições da API Windguru
│   │   │   └── alertsService.ts    # Verifica alertas e envia push
│   │   ├── routes/             # Mapeamento de rotas Express
│   │   ├── middleware/
│   │   │   ├── auth.ts         # Verifica Bearer token Firebase
│   │   │   └── errorHandler.ts # Handler global de erros
│   │   └── __tests__/          # Jest — unit + integration
│   ├── migrations/
│   │   └── 001_create_tables.sql   # Schema completo
│   ├── seeds/
│   │   └── beaches_seed.sql    # 121 praias brasileiras
│   ├── nginx/
│   │   └── surfyng.conf        # Proxy reverso + rate limit + SSL
│   ├── scripts/
│   │   ├── setup-hostinger.sh  # Configuração do VPS do zero
│   │   ├── deploy.sh           # Deploy com zero downtime via PM2
│   │   └── gerar-seed-praias.js # Gera seed a partir do .xlsx + Nominatim
│   ├── ecosystem.config.js     # Configuração PM2 cluster mode
│   └── .env.example            # Template de variáveis de ambiente
│
└── mobile/                     # App React Native + Expo
    ├── app/                    # Expo Router — file-based routing
    │   ├── _layout.tsx         # Root layout: Firebase auth + deep links
    │   ├── index.tsx           # Redirect inteligente (onboarding/login/tabs)
    │   ├── (auth)/             # Fluxo de autenticação
    │   │   ├── onboarding.tsx  # 3 slides de apresentação
    │   │   ├── login.tsx       # Google OAuth
    │   │   └── profile-setup.tsx # Nível + tolerância ao frio
    │   ├── (tabs)/             # Navegação principal (bottom tabs)
    │   │   ├── index.tsx       # Home: recomendação GPS + praias próximas
    │   │   ├── map.tsx         # Mapa com pins coloridos por score
    │   │   ├── feed.tsx        # Feed de sessões da comunidade
    │   │   ├── notifications.tsx
    │   │   └── profile.tsx
    │   ├── beach/[id].tsx      # Detalhes da praia + alertas
    │   ├── post/create.tsx     # Criar post com fotos e estrelas
    │   └── plans.tsx           # Planos Free/Pro/Global
    ├── src/
    │   ├── api/                # Funções Axios por domínio
    │   ├── components/         # BeachCard, ScoreBadge, ConditionsCard, EmptyState
    │   ├── config/firebase.ts  # Firebase JS SDK (Web modular v10)
    │   ├── hooks/useLocation.ts # GPS + geocoding reverso
    │   ├── store/authStore.ts  # Zustand: firebaseUser, user, token
    │   ├── theme/index.ts      # Cores, spacing, typography, scoreColor()
    │   └── types/index.ts      # Interfaces TypeScript globais
    └── .env.example
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `NODE_ENV` | Ambiente | `production` |
| `PORT` | Porta do servidor | `3000` |
| `APP_NAME` | Nome do app (notificações) | `Surfyng` |
| `CORS_ORIGIN` | Domínio do frontend web | `https://app.surfyng.com.br` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost/db` |
| `REDIS_URL` | Connection string Redis | `redis://localhost:6379` |
| `FIREBASE_PROJECT_ID` | ID do projeto Firebase | `surfyng-app` |
| `FIREBASE_CLIENT_EMAIL` | Email da conta de serviço Firebase | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Chave privada da conta de serviço | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `WINDGURU_USER` | Usuário da API Windguru | `seu_usuario` |
| `WINDGURU_PASS` | Senha da API Windguru | `sua_senha` |
| `STRIPE_SECRET_KEY` | Chave secreta Stripe | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret do webhook Stripe | `whsec_...` |
| `STRIPE_PRICE_PRO` | ID do preço recorrente Pro | `price_...` |
| `STRIPE_PRICE_GLOBAL` | ID do preço recorrente Global | `price_...` |
| `STRIPE_SUCCESS_URL` | URL de sucesso do checkout | `https://app.surfyng.com.br/...` |
| `STRIPE_CANCEL_URL` | URL de cancelamento | `https://app.surfyng.com.br/...` |
| `STRIPE_PORTAL_RETURN_URL` | URL de retorno do portal Stripe | `https://app.surfyng.com.br/...` |

### Mobile (`mobile/.env`)

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base da API backend |
| `EXPO_PUBLIC_WEB_URL` | URL do frontend web (checkout Stripe) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | API Key pública do Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain do Firebase |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Project ID do Firebase |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID do Firebase |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Client ID Web (Google OAuth) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Client ID iOS (Google OAuth) |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Client ID Android (Google OAuth) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Chave Google Maps (MapScreen) |

---

## Algoritmo de score das praias

O score de **0 a 10** é calculado pelo `beachesService.ts` com base nas condições atuais do Windguru e nas características da praia:

| Critério | Peso |
|---|---|
| Altura da ondulação (swell) | 4 pts |
| Direção da ondulação (ideal para a praia) | 3 pts |
| Direção do vento (offshore) | 2 pts |
| Velocidade do vento (< 15 nós = melhor) | 1 pt |

**Recomendação de roupa:** Calculada a partir da temperatura da água + `cold_tolerance` do usuário (±2°C de ajuste para sensível/resistente).
