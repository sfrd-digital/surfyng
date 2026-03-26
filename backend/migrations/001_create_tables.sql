-- Migration 001: Criação de todas as tabelas do Surfyng
-- Executar com: psql $DATABASE_URL -f migrations/001_create_tables.sql

-- Habilita a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tabela: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid        VARCHAR(128) UNIQUE NOT NULL,
  name                VARCHAR(100),
  email               VARCHAR(255) UNIQUE,
  photo_url           TEXT,
  level               VARCHAR(20)  NOT NULL DEFAULT 'beginner'
                        CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  cold_tolerance      VARCHAR(20)  NOT NULL DEFAULT 'normal'
                        CHECK (cold_tolerance IN ('sensitive', 'normal', 'resistant')),
  plan                VARCHAR(20)  NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'pro', 'global')),
  stripe_customer_id  VARCHAR(100),
  base_lat            DECIMAL(10, 8),
  base_lng            DECIMAL(11, 8),
  city                VARCHAR(100),
  push_token          TEXT,
  language            VARCHAR(5)   NOT NULL DEFAULT 'pt',
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- Tabela: beaches
-- ============================================================
CREATE TABLE IF NOT EXISTS beaches (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    VARCHAR(100) NOT NULL,
  city                    VARCHAR(100),
  state                   VARCHAR(5),
  country                 VARCHAR(5)   NOT NULL DEFAULT 'BR',
  lat                     DECIMAL(10, 8) NOT NULL,
  lng                     DECIMAL(11, 8) NOT NULL,
  swell_directions        TEXT[]       NOT NULL DEFAULT '{}',
  wind_directions         TEXT[]       NOT NULL DEFAULT '{}',
  min_size_feet           INTEGER,
  max_size_feet           INTEGER,
  difficulty              VARCHAR(20)
                            CHECK (difficulty IN ('low', 'medium_low', 'medium', 'medium_high', 'high')),
  best_season             VARCHAR(100),
  consistency             VARCHAR(10)
                            CHECK (consistency IN ('low', 'medium', 'high')),
  crowd                   VARCHAR(10)
                            CHECK (crowd IN ('low', 'medium', 'intense')),
  windguru_station_id     INTEGER,
  water_temp_summer_c     DECIMAL(4, 1),
  water_temp_winter_c     DECIMAL(4, 1),
  description             TEXT,
  created_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índice geográfico para buscas por raio (lat/lng)
CREATE INDEX IF NOT EXISTS idx_beaches_location ON beaches(lat, lng);
CREATE INDEX IF NOT EXISTS idx_beaches_state ON beaches(state);
CREATE INDEX IF NOT EXISTS idx_beaches_difficulty ON beaches(difficulty);

-- ============================================================
-- Tabela: conditions_cache
-- Cache das condições meteorológicas por praia (TTL 30 minutos)
-- ============================================================
CREATE TABLE IF NOT EXISTS conditions_cache (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beach_id                UUID NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  wind_speed              DECIMAL(5, 1),
  wind_direction          VARCHAR(20),
  swell_height            DECIMAL(4, 2),
  swell_direction         VARCHAR(20),
  swell_period            INTEGER,
  water_temp_c            DECIMAL(4, 1),
  air_temp_c              DECIMAL(4, 1),
  wetsuit_recommendation  VARCHAR(30),
  score                   DECIMAL(3, 1),
  fetched_at              TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at              TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conditions_beach_id ON conditions_cache(beach_id);
CREATE INDEX IF NOT EXISTS idx_conditions_expires_at ON conditions_cache(expires_at);

-- ============================================================
-- Tabela: favorite_beaches
-- ============================================================
CREATE TABLE IF NOT EXISTS favorite_beaches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beach_id    UUID NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, beach_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorite_beaches(user_id);

-- ============================================================
-- Tabela: posts
-- Posts da comunidade com avaliação de sessão de surf
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beach_id              UUID NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  rating                INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text                  TEXT,
  photos                TEXT[]    NOT NULL DEFAULT '{}',
  conditions_snapshot   JSONB,
  likes_count           INTEGER   NOT NULL DEFAULT 0,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_beach_id ON posts(beach_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================================
-- Tabela: post_likes
-- Controla quem curtiu cada post (evita likes duplicados)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

-- ============================================================
-- Tabela: subscriptions
-- Histórico de assinaturas via Stripe
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                        VARCHAR(20) NOT NULL
                                CHECK (plan IN ('free', 'pro', 'global')),
  stripe_subscription_id      VARCHAR(100),
  stripe_checkout_session_id  VARCHAR(100),
  status                      VARCHAR(20) NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  started_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
  ends_at                     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- ============================================================
-- Tabela: alert_preferences
-- Configuração de alertas de condições por praia
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_preferences (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beach_id    UUID NOT NULL REFERENCES beaches(id) ON DELETE CASCADE,
  min_score   DECIMAL(3, 1) NOT NULL DEFAULT 8.0,
  active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, beach_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alert_preferences(active) WHERE active = TRUE;

-- ============================================================
-- Tabela: notifications
-- Histórico de notificações enviadas
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beach_id    UUID REFERENCES beaches(id) ON DELETE SET NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,
  type        VARCHAR(50) NOT NULL DEFAULT 'alert', -- alert, system, marketing
  read        BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read) WHERE read = FALSE;
