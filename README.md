# Hair-RDV

Application de prise de rendez-vous en ligne pour salon de coiffure, construite avec **Next.js 15**, **PostgreSQL** et **TypeScript strict**.

Design **macOS 26 Liquid Glass** — glassmorphisme sombre avec système de radius et blur cohérent.

---

## Fonctionnalités

### Côté client (public)
- **Formulaire 4 étapes** : choix coiffeur → calendrier → créneau → infos client
- Calendrier mensuel custom (sans librairie), **overlay de disponibilité** : jours indisponibles/complets grisés dynamiquement depuis la DB
- Créneaux générés dynamiquement depuis la DB (horaires + capacité par coiffeur)
- **Profils coiffeurs dynamiques** sur la page d'accueil (description + points forts)
- Protection anti-bot : honeypot invisible + rate-limit IP (3/24h)
- Confirmation par e-mail avec lien tokenisé (expiration 15 min) si mode renforcé
- Programme de fidélité : silver (3 visites), gold (6), platinum (10)
- Page `/confirmation/[token]` — succès, expiré, déjà utilisé
- Page `/confidentialite` — politique RGPD statique

### Côté serveur (API publique)
- `POST /api/reservations` — 12 étapes : Zod → honeypot → rate-limit → blacklist → coiffeur actif → créneau dispo → doublon → saturation → mode renforcé → statut → insert → log trafic
- `GET /api/confirmation/[token]` — vérifie et confirme le token email
- `GET /api/disponibilite?coiffeur_id=&mois=YYYY-MM` — disponibilité par jour pour un mois entier
- `GET /api/creneaux?date=&coiffeur_id=` — créneaux disponibles pour un coiffeur/date
- `GET /api/coiffeurs` — coiffeurs actifs (nom, description, points forts)
- `POST /api/trafic` — log de visite anonymisé

### Espace admin (`/admin/*`)
Toutes les routes admin sont protégées par le middleware JWT.

**Pages :**
- `/admin/reservations` — tableau complet : coiffeur, tier fidélité, actions Présent/No-show, filtres
- `/admin` — **dashboard récapitulatif** : horaires en vigueur par coiffeur, congés à venir
- `/admin/coiffeurs` — ajout/édition (nom, description, points forts)/désactivation/suppression
- `/admin/horaires` — planning hebdomadaire par coiffeur (auto-seed 7 jours si vide)
- `/admin/fermetures` — fermetures exceptionnelles (dates passées grisées, suppression future uniquement)
- `/admin/planning` — grille hebdo colorée par taux de remplissage
- `/admin/securite` — toggle mode renforcé, seuil blacklist, déblocage emails
- `/admin/analytics` — graphiques recharts : RDV/jour, trafic/jour, statuts, KPIs, remplissage

**API admin :**
- `GET|POST /api/admin/coiffeurs`
- `PUT|DELETE /api/admin/coiffeurs/[id]`
- `GET|PUT /api/admin/horaires`
- `GET|POST|DELETE /api/admin/fermetures`
- `PATCH /api/admin/reservations/[id]/status`
- `GET /api/admin/analytics`
- `GET /api/admin/blacklist` · `DELETE /api/admin/blacklist/[email]`
- `GET|PUT /api/admin/settings` · `PUT /api/admin/settings/key`

---

## Architecture

```
app/
├── page.tsx                               — Landing page
├── rdv/page.tsx                           — Page réservation
├── contact/page.tsx                       — Contact + horaires
├── confirmation/[token]/page.tsx          — Confirmation email
├── confidentialite/page.tsx               — Politique RGPD
├── admin/
│   ├── reservations/page.tsx
│   ├── coiffeurs/page.tsx
│   ├── horaires/page.tsx
│   ├── fermetures/page.tsx
│   ├── planning/page.tsx
│   ├── securite/page.tsx
│   ├── analytics/page.tsx
│   └── login/page.tsx
└── api/                                   — Toutes les routes API

components/
├── BookingForm.tsx                        — Formulaire 4 étapes ('use client')
├── CoiffeursSection.tsx                   — Profils coiffeurs dynamiques (Server Component)
├── Navbar.tsx                             — Navbar publique flottante
├── PublicLayout.tsx                       — Wrapper pages publiques
└── admin/
    ├── AdminLayout.tsx                    — Wrapper pages admin (dark glass)
    ├── AdminNavbar.tsx                    — Navbar admin ('use client')
    ├── ReservationList.tsx                — Tableau réservations ('use client')
    └── LoginForm.tsx                      — Formulaire connexion ('use client')

lib/
├── db.ts          — Pool PostgreSQL (pg)
├── jwt.ts         — Signature / vérification JWT (jose, Edge-compatible)
├── hash.ts        — Hachage SHA-256 IP (Web Crypto API native)
├── schemas.ts     — Tous les schémas Zod
├── security.ts    — Rate-limit, honeypot, blacklist, saturation
├── loyalty.ts     — Programme de fidélité (upsert tier)
├── safe-emails.ts — Emails de confiance
└── mailer.ts      — Emails via Resend (fallback console.log)

middleware.ts                              — Protection JWT centralisée
db/migrations/
├── 001_init.sql                           — Schéma initial
├── 002_add_missing_tables.sql             — Multi-coiffeurs, fidélité, sécurité
└── 003_coiffeur_profile.sql               — Description + points forts coiffeurs
scripts/
├── create-admin.ts                        — Création compte admin
└── cleanup.ts                             — Nettoyage RGPD (90j/30j)
```

---

## Base de données

| Table | Description |
|---|---|
| `admin_users` | Comptes administrateurs |
| `settings` | Paramètres clé/valeur |
| `reservations` | Réservations (6 statuts) |
| `coiffeur` | Coiffeurs (actif/inactif, description, points forts) |
| `horaires` | Planning hebdo par coiffeur |
| `creneau` | Créneaux datés avec capacité |
| `jour_ferme` | Fermetures exceptionnelles |
| `trafic_log` | Visites anonymisées |
| `blacklist` | Emails bannis |
| `safe_emails` | Emails vérifiés/présents |
| `loyalty` | Fidélité (none/silver/gold/platinum) |

**Statuts réservation :** `pending_verification` → `pending` → `confirmed` → `present` / `no_show` / `cancelled`

---

## Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) et Docker Compose

---

## Démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Variables obligatoires :

| Variable | Description |
|---|---|
| `JWT_SECRET` | Clé secrète longue (min. 32 caractères) |
| `IP_HASH_SALT` | Sel pour le hachage des IPs |
| `NEXT_PUBLIC_SALON_NAME` | Nom du salon |
| `NEXT_PUBLIC_SALON_ADDRESS` | Adresse |
| `NEXT_PUBLIC_SALON_PHONE` | Téléphone |
| `NEXT_PUBLIC_SALON_EMAIL` | E-mail contact |
| `NEXT_PUBLIC_SERVICES` | Prestations séparées par virgules |
| `NEXT_PUBLIC_BASE_URL` | URL de base (ex. `http://localhost:3000`) |

Variables optionnelles :

| Variable | Description |
|---|---|
| `RESEND_API_KEY` | Clé Resend pour les emails (sinon logs console) |
| `EMAIL_FROM` | Adresse expéditeur |
| `NO_SHOW_THRESHOLD` | Nombre de no-shows avant blacklist (défaut : 3) |

### 3. Démarrer la base de données

```bash
npm run db:up
```

Docker démarre PostgreSQL et exécute automatiquement `001_init.sql`.

### 4. Appliquer les migrations

```bash
# Dans un client SQL (psql, TablePlus, DBeaver…) ou via la commande :
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d hairrdv -f db/migrations/002_add_missing_tables.sql
PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d hairrdv -f db/migrations/003_coiffeur_profile.sql
```

### 5. Créer le compte administrateur

```bash
npm run admin:create
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

| URL | Description |
|---|---|
| `http://localhost:3000` | Site public |
| `http://localhost:3000/rdv` | Formulaire de réservation |
| `http://localhost:3000/admin/login` | Connexion admin |
| `http://localhost:3000/admin/reservations` | Dashboard admin |

---

## Commandes

```bash
npm run dev           # Serveur de développement (port 3000, accessible réseau/Tailscale)
npm run dev:local     # Serveur localhost uniquement
npm run build         # Build de production
npm run start         # Démarrer le build de production
npm run lint          # ESLint
npm run db:up         # Démarrer PostgreSQL (Docker)
npm run db:down       # Arrêter PostgreSQL
npm run admin:create  # Créer / mettre à jour un compte admin
npm run cleanup       # Nettoyage RGPD (réservations +90j, trafic +30j)
```

---

## Sécurité en production

- Remplacer `JWT_SECRET` et `IP_HASH_SALT` par des valeurs aléatoires longues
- Configurer HTTPS — le cookie `admin_token` passe automatiquement en `Secure` quand `NODE_ENV=production`
- Ne jamais commiter `.env.local` (déjà dans `.gitignore`)
- Le rate-limit IP est en mémoire — utiliser Redis en production pour la persistance entre instances
