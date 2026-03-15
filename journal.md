# Journal des modifications

---

## 2026-03-13 — Initialisation du projet + refonte design

### Scaffold initial
- Création complète du projet Next.js 15 / React 19 / TypeScript strict
- Configuration Docker Compose (PostgreSQL 16-alpine, port 5433 pour éviter le conflit avec PostgreSQL local Homebrew)
- Migration SQL `db/migrations/001_init.sql` : tables `admin_users`, `settings`, `reservations`
- Variables d'environnement via `.env.local` (toutes les données textuelles du salon en `NEXT_PUBLIC_*`)
- Script `scripts/create-admin.ts` : création du compte admin en interactif ou non-interactif, charge `.env.local` automatiquement

### Sécurité
- Middleware JWT centralisé (`middleware.ts`) protégeant `/admin/*` et `/api/admin/*`
- Honeypot anti-bot dans le formulaire (`type="text"` + `display:none`) — retour 200 silencieux si rempli
- Hachage IP SHA-256 via Web Crypto API native (aucune librairie externe), salé avec `IP_HASH_SALT`
- Mode sécurité renforcée : lu en DB à chaque `POST /api/reservations`, limite à 3 réservations / IP / 24 h
- Cookie JWT `httpOnly`, `sameSite: lax`, `Secure` en production

### API routes
- `POST /api/reservations` — création de réservation (public)
- `POST /api/admin/auth` — connexion admin (bcrypt + JWT)
- `POST /api/admin/logout` — déconnexion (efface le cookie)
- `GET|PUT /api/admin/reservations` — liste et mise à jour du statut
- `GET|PUT /api/admin/settings` — lecture et modification des paramètres

### Interface admin
- Dashboard avec deux onglets : Réservations / Paramètres
- Tableau des réservations avec statistiques (total, en attente, confirmé, annulé) et filtres par statut
- Actions par ligne : Confirmer / Annuler / Remettre en attente
- Toggle mode sécurité renforcée

---

### Refonte design — Glassmorphisme

**Nouveau thème global**
- Fond sombre `#06060f` avec orbes CSS fixes (violet, teal, bleu) en `backdrop-filter: blur`
- Palette : blanc/transparent pour les textes, **amber/doré** (`amber-400`) pour les accents et CTA
- Typographie ultra-fine (`font-thin`) pour un rendu épuré et luxe

**Système de design macOS 26 Liquid Glass (`globals.css`)**
- Variables CSS : `--radius-*` (xs→2xl→pill), `--blur-*` (sm→xl→orb), `--glass-bg/border`, `--amber`
- `.glass` — carte principale : bordures asymétriques (top/left plus claires = source lumière haut-gauche)
- `.glass-sm` — variante légère pour navbar et petites surfaces
- `.glass-modal` — fond modal avec blur xl et ombre profonde
- `.btn-amber` — bouton doré primaire, toujours pill, glow au hover
- `.btn-glass` — bouton secondaire transparent, pill
- `.input-dark` — champ sombre avec focus amber
- `.badge-glass / .badge-amber / .badge-green / .badge-red` — badges pill
- `.toggle-track / .toggle-thumb` — toggle switch macOS animé

**Composants publics**
- `Navbar.tsx` — navbar flottante pill (glass-sm), fixe, CTA amber, hamburger mobile
- `PublicLayout.tsx` — wrapper pages publiques : fond sombre, orbes, navbar, footer env vars

**Pages publiques**
- `/` — landing page : hero, grille 8 services, profil Sophie Martin, 3 témoignages, CTA
- `/rdv` — page dédiée au formulaire (BookingForm)
- `/contact` — informations salon, horaires, placeholder carte

---

## 2026-03-14 — Expansion majeure : multi-coiffeurs, fidélité, sécurité avancée

### Migration DB `002_add_missing_tables.sql`
Nouvelles tables :
- `coiffeur` — id UUID, nom, actif, created_at
- `horaires` — planning hebdomadaire par coiffeur (ouvert/fermé + heures)
- `creneau` — créneaux datés avec capacité et places restantes
- `jour_ferme` — fermetures exceptionnelles par coiffeur
- `trafic_log` — visites anonymisées (ip_hash SHA-256)
- `blacklist` — emails bannis automatiquement après N no-shows
- `safe_emails` — emails vérifiés ou marqués présents (bypass mode renforcé)
- `loyalty` — programme de fidélité (silver=3, gold=6, platinum=10 visites)

Colonnes ajoutées à `reservations` : `coiffeur_id`, `confirmation_token`, `token_expire_at`

Nouveaux statuts : `pending_verification`, `present`, `no_show` (en plus des existants)

Nouveaux settings : `reservations_en_ligne`, `capacite_defaut`, `duree_creneau_minutes`, `no_show_threshold`

### Librairies helpers (`lib/`)
- `lib/security.ts` — rate-limit IP (Map en mémoire, 3/IP/24h), detectHoneypot, checkBlacklist, detectSaturation
- `lib/loyalty.ts` — updateLoyalty (upsert + recalcul tier), getLoyalty
- `lib/safe-emails.ts` — isSafeEmail, addSafeEmail
- `lib/mailer.ts` — sendConfirmationEmail + sendRecapEmail via Resend HTTP API (fallback console.log si clé absente)

### API routes publiques
- `POST /api/reservations` — réécriture complète 12 étapes : Zod → honeypot → rate-limit → blacklist → coiffeur actif → créneau dispo → doublon → saturation → mode renforcé → statut (confirmed ou pending_verification + token) → insert + email → log trafic
- `GET /api/confirmation/[token]` — vérifie token, statut et expiration (15 min), confirme la réservation, addSafeEmail
- `GET /api/creneaux?date=&coiffeur_id=` — génère les créneaux selon horaires DB, filtre fermetures et bloqués
- `GET /api/coiffeurs` — retourne les coiffeurs actifs
- `POST /api/trafic` — enregistre une visite anonymisée

### API routes admin (nouvelles)
- `GET|POST /api/admin/coiffeurs` — liste + création (avec 7 horaires auto : lun-sam 09-18, dim fermé)
- `DELETE /api/admin/coiffeurs/[id]` — désactivation logique si RDV futurs, suppression physique sinon
- `GET|PUT /api/admin/horaires` — lecture/mise à jour planning hebdo par coiffeur
- `GET|POST|DELETE /api/admin/fermetures` — gestion des fermetures exceptionnelles
- `PATCH /api/admin/reservations/[id]/status` — mise à jour avec effets de bord (fidélité, blacklist, restauration créneau)
- `GET /api/admin/analytics` — KPIs 30 jours + répartition statuts + trafic + taux remplissage
- `GET /api/admin/blacklist` — liste des emails blacklistés
- `DELETE /api/admin/blacklist/[email]` — déblocage d'un email
- `PUT /api/admin/settings/key` — upsert d'une clé de paramètre

### Pages admin (nouvelles, toutes avec AdminLayout dark glass)
- `/admin/reservations` — tableau mis à jour : colonne coiffeur, badge tier fidélité, actions Présent/No-show, filtre par coiffeur, 6 statuts, PATCH vers le nouvel endpoint
- `/admin/coiffeurs` — liste actifs/inactifs, modal ajout, suppression avec confirmation
- `/admin/horaires` — sélecteur coiffeur, grille 7 jours avec toggle + heures
- `/admin/fermetures` — sélecteur coiffeur, ajout/suppression dates fermées
- `/admin/planning` — grille hebdomadaire, créneaux colorés selon remplissage
- `/admin/securite` — toggle mode renforcé, seuil blacklist, liste emails bannis + déblocage
- `/admin/analytics` — recharts : barres RDV/jour, ligne trafic/jour, camembert statuts, KPI cards, barres remplissage par coiffeur

Admin navbar (`AdminNavbar.tsx`) et layout (`AdminLayout.tsx`) refaits en dark glass avec orbes.
`/admin` redirige désormais vers `/admin/reservations`.

### Interface publique — BookingForm 4 étapes
Réécriture complète de `BookingForm.tsx` :
1. Choix du coiffeur (cartes cliquables depuis `/api/coiffeurs`)
2. Choix de la date (calendrier mensuel custom, navigation mois, désactivation passé)
3. Choix du créneau (grille depuis `/api/creneaux`, message si aucun dispo)
4. Infos client (nom, email, téléphone, prestation, honeypot `_trap` caché, checkbox RGPD obligatoire)

Barre de progression 4 étapes en haut. Bouton retour entre chaque étape.

### Nouvelles pages publiques
- `/confirmation/[token]` — page de confirmation email : succès (récap RDV), expiré, déjà utilisé, invalide
- `/confidentialite` — politique de confidentialité statique (données, durée 90j, droits RGPD, contact)

### Script RGPD
- `scripts/cleanup.ts` — supprime les réservations > 90j et trafic_log > 30j
- Commande : `npm run cleanup`

### Environnement
- `.env.local` : ajout de `NEXT_PUBLIC_BASE_URL`
- `.env.local.example` : ajout de `NEXT_PUBLIC_BASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `NO_SHOW_THRESHOLD`

---

## Problèmes résolus

| Problème | Cause | Solution |
|---|---|---|
| "Impossible de joindre le serveur" | Docker non démarré | Ouvrir Docker Desktop avant `npm run db:up` |
| Port 5432 déjà alloué | PostgreSQL@14 Homebrew actif | Changement du port Docker vers `5433` dans `docker-compose.yml` et `.env.local` |
| "Identifiants invalides" après changement de port | Compte admin créé sur l'ancienne DB (port 5432) | Relancer `npm run admin:create` après redémarrage de Next.js |
| Script `create-admin` ignorait `.env.local` | `tsx` ne charge pas les fichiers `.env` automatiquement | Ajout d'un parser manuel de `.env.local` en tête du script |
| `uuid_generate_v4()` indisponible | Extension uuid non chargée sur PostgreSQL 16 | Utilisation de `gen_random_uuid()` (built-in PostgreSQL 13+) |

---

## 2026-03-15 — Corrections majeures et améliorations UX

### Migration DB `003_coiffeur_profile.sql`
- `ALTER TABLE coiffeur ADD COLUMN description TEXT` — texte de présentation du coiffeur
- `ALTER TABLE coiffeur ADD COLUMN points_forts TEXT[]` — tags de spécialités (ex: "Colorations", "Balayage")

### BUG 1 — Horaires/fermetures admin synchronisés avec la DB
- `GET /api/admin/horaires` : auto-seed de 7 lignes par défaut (lun-sam 09:00-18:00, dim fermé) si aucune entrée n'existe pour le coiffeur
- Page `/admin/horaires` : toast vert "Horaires enregistrés" après sauvegarde (3 secondes)
- Page `/admin/fermetures` : dates passées grisées (opacity + badge "Passé"), bouton Supprimer masqué pour les dates passées

### BUG 2 — Calendrier client synchronisé avec la DB
- **Nouvelle API** `GET /api/disponibilite?coiffeur_id=&mois=YYYY-MM` — retourne pour chaque jour du mois un statut : `disponible`, `indisponible` (fermé/passé) ou `complet` (tous créneaux pleins)
- **BookingForm** réécrit : le calendrier fetch la disponibilité du mois courant + suivant en parallèle, grise les jours indisponibles/complets
- `GET /api/creneaux` : retourne `{ creneaux: [], raison: 'jour_ferme' | 'horaire_ferme' }` quand un jour est fermé
- **Rate limiter** déplacé après la vérification de créneau : les utilisateurs ne sont plus pénalisés quand un créneau est complet (erreur 409 ne déclenche plus le rate limit)
- Légende du calendrier : points disponible/indisponible

### PROB 3 — Profils coiffeurs dynamiques
- `PUT /api/admin/coiffeurs/[id]` : mise à jour dynamique nom, description, points_forts (clause SET construite dynamiquement)
- Page `/admin/coiffeurs` : modal ajout et édition avec description (textarea), points forts (tags input Enter/virgule, clic × pour supprimer)
- **Nouveau composant** `CoiffeursSection.tsx` : Server Component async qui query directement la table coiffeur via `pool.query`, affiche les cartes avec initiales, nom, description, badges points forts
- Page d'accueil `/` : section "About Sophie" remplacée par `<CoiffeursSection />` dynamique

### AMÉL 4 — Dashboard admin récapitulatif
- `/admin` : Server Component avec 2 blocs :
  - Horaires en vigueur par coiffeur actif (grille 7 jours)
  - Congés à venir (10 prochains, dates en français, badge ambre sur le plus proche)
- Fallback "Données indisponibles" si erreur DB

### AMÉL 5 — Navbar réduite
- `Navbar.tsx` : `py-3` → `py-2` (épaisseur réduite)

### AMÉL 6 — Accès réseau
- `package.json` : `"dev": "next dev --hostname 0.0.0.0"` pour accès Tailscale/LAN
- Script `"dev:local"` ajouté pour mode localhost classique