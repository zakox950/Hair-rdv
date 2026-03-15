-- ============================================================
-- Migration 002 — tables complémentaires + colonnes manquantes
-- ============================================================

-- Coiffeurs
CREATE TABLE IF NOT EXISTS coiffeur (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nom        VARCHAR(100) NOT NULL,
    actif      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Horaires par coiffeur (1 ligne / jour_semaine, 0=dim … 6=sam)
CREATE TABLE IF NOT EXISTS horaires (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    coiffeur_id     UUID    NOT NULL REFERENCES coiffeur(id) ON DELETE CASCADE,
    jour_semaine    INT     NOT NULL CHECK (jour_semaine BETWEEN 0 AND 6),
    heure_ouverture TIME    NOT NULL DEFAULT '09:00',
    heure_fermeture TIME    NOT NULL DEFAULT '18:00',
    ouvert          BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (coiffeur_id, jour_semaine)
);

-- Créneaux par coiffeur (générés dynamiquement ou overridés)
CREATE TABLE IF NOT EXISTS creneau (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    coiffeur_id      UUID    NOT NULL REFERENCES coiffeur(id) ON DELETE CASCADE,
    jour             DATE    NOT NULL,
    heure_debut      TIME    NOT NULL,
    capacite_max     INT     NOT NULL DEFAULT 1,
    places_restantes INT     NOT NULL DEFAULT 1,
    bloque           BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (coiffeur_id, jour, heure_debut),
    CHECK (places_restantes >= 0),
    CHECK (places_restantes <= capacite_max)
);

-- Fermetures exceptionnelles
CREATE TABLE IF NOT EXISTS jour_ferme (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    coiffeur_id UUID         NOT NULL REFERENCES coiffeur(id) ON DELETE CASCADE,
    date        DATE         NOT NULL,
    motif       VARCHAR(255),
    UNIQUE (coiffeur_id, date)
);

-- Trafic anonymisé
CREATE TABLE IF NOT EXISTS trafic_log (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    page       VARCHAR(100) NOT NULL,
    ip_hash    CHAR(64)     NOT NULL,
    visited_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Blacklist
CREATE TABLE IF NOT EXISTS blacklist (
    email      TEXT      PRIMARY KEY,
    reason     TEXT      NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Emails de confiance
CREATE TABLE IF NOT EXISTS safe_emails (
    email      TEXT PRIMARY KEY,
    reason     TEXT NOT NULL CHECK (reason IN ('verified', 'marked_present')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Fidélité
CREATE TABLE IF NOT EXISTS loyalty (
    email       TEXT PRIMARY KEY,
    visit_count INT  NOT NULL DEFAULT 0,
    tier        TEXT NOT NULL DEFAULT 'none'
                     CHECK (tier IN ('none', 'silver', 'gold', 'platinum')),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Colonnes manquantes sur reservations ─────────────────────────────────────
ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS coiffeur_id UUID REFERENCES coiffeur(id) ON DELETE RESTRICT;

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS confirmation_token VARCHAR(128) UNIQUE;

ALTER TABLE reservations
    ADD COLUMN IF NOT EXISTS token_expire_at TIMESTAMP;

-- Mise à jour de la contrainte de statut
DO $$
DECLARE c TEXT;
BEGIN
    SELECT conname INTO c
    FROM pg_constraint
    WHERE conrelid = 'reservations'::regclass AND contype = 'c' AND conname LIKE '%status%';
    IF c IS NOT NULL THEN
        EXECUTE format('ALTER TABLE reservations DROP CONSTRAINT %I', c);
    END IF;
END $$;

ALTER TABLE reservations
    ADD CONSTRAINT reservations_status_check
    CHECK (status IN ('pending_verification','pending','confirmed','cancelled','present','no_show'));

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reservations_coiffeur_id ON reservations(coiffeur_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email       ON reservations(email);
CREATE INDEX IF NOT EXISTS idx_reservations_status      ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at  ON reservations(created_at);
CREATE INDEX IF NOT EXISTS idx_creneau_coiffeur_jour    ON creneau(coiffeur_id, jour);
CREATE INDEX IF NOT EXISTS idx_trafic_log_visited_at    ON trafic_log(visited_at);
CREATE INDEX IF NOT EXISTS idx_horaires_coiffeur        ON horaires(coiffeur_id);

-- ── Settings manquants ────────────────────────────────────────────────────────
INSERT INTO settings (key, value) VALUES
    ('enhanced_security_mode', 'false'),
    ('reservations_en_ligne',  'true'),
    ('capacite_defaut',        '1'),
    ('duree_creneau_minutes',  '30'),
    ('no_show_threshold',      '3')
ON CONFLICT (key) DO NOTHING;
