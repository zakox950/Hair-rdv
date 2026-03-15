# Feuille de route — Prochaines mises à jour

> Ce fichier liste les fonctionnalités planifiées. Rien n'est implémenté pour l'instant.

---

## 1. Contrôle avancé du planning (côté admin)

### Fermeture de jours au choix
- Interface admin permettant de bloquer des dates précises (jours fériés, congés, fermeture exceptionnelle)
- Les dates bloquées disparaissent du calendrier côté formulaire de réservation
- Stocker les dates fermées dans la table `settings` ou une nouvelle table `closed_days(date DATE, reason TEXT)`

### Horaires dynamiques
- L'admin peut modifier les horaires d'ouverture directement depuis le dashboard (au lieu des variables d'environnement)
- Les créneaux du formulaire se régénèrent en temps réel selon les horaires sauvegardés en DB
- Prévoir une granularité par jour de la semaine (ex. samedi ferme à 18h, jeudi jusqu'à 20h)
- Nouvelle table `opening_hours(day_of_week INT, open_time TIME, close_time TIME, is_open BOOLEAN)`

---

## 2. Statistiques et graphiques (côté admin)

- Graphique en barres : nombre de réservations par jour / semaine / mois
- Graphique en secteurs : répartition par prestation (coupe, coloration, etc.)
- Indicateurs clés : taux de confirmation, taux d'annulation, taux de no-show
- Courbe d'évolution du nombre de clients dans le temps
- Librairie envisagée : `recharts` (léger, compatible React/Next.js)

---

## 3. Système de présence, blacklist et fidélité

### Liste de présence
- Le coiffeur peut marquer une réservation comme `present` ou `no-show` (en plus de `confirmed` / `cancelled`)
- Nouveau statut dans la colonne `status` de la table `reservations` : ajout de `'present'` et `'no_show'`

### Blacklist
- Après N no-shows consécutifs (paramétrable, ex. 3), le client est automatiquement blacklisté
- Un client blacklisté voit son formulaire refusé silencieusement (ou avec un message doux)
- Nouvelle table `blacklist(email TEXT PK, reason TEXT, created_at TIMESTAMPTZ)`

### Programme de fidélité
- Compteur de visites par email (basé sur les réservations marquées `present`)
- Paliers de fidélité configurables (ex. 5 visites = statut Gold, 10 visites = statut Platinum)
- Affichage du statut fidélité dans la fiche client côté admin
- Nouvelle table `loyalty(email TEXT PK, visit_count INT, tier TEXT, updated_at TIMESTAMPTZ)`

---

## 4. Refonte du design admin

- Aligner le design de l'espace admin sur le thème glassmorphisme du site vitrine
- Remplacer le fond `stone-100` par le même fond sombre `#06060f` avec orbes
- Appliquer les classes `.glass`, `.btn-amber`, `.input-dark` aux composants admin
- Rendre les tableaux de réservations plus lisibles avec le thème sombre

---

## 5. Vérification d'email et épingle de confiance

### Flux de vérification
- Lors d'une réservation, envoyer un email de confirmation avec un lien ou un code PIN à 6 chiffres
- La réservation reste en statut `pending_verification` tant que l'email n'est pas confirmé
- Après confirmation, passer automatiquement à `pending` (en attente du coiffeur)
- Librairie envisagée : `nodemailer` ou `resend` pour l'envoi d'emails

### PIN spécial
- Les clients ayant vérifié leur email reçoivent un PIN personnel stocké en DB
- Ce PIN peut être saisi à la prochaine réservation pour bypasser la vérification email

---

## 6. Table des emails de confiance (`safe_emails`)

### Logique de confiance
Un email est considéré **safe** (de confiance) si **au moins une** des conditions suivantes est remplie :
1. Le coiffeur a marqué au moins une réservation de ce client comme `present`
2. Le client a vérifié son email via le lien de confirmation

### Comportement
- Si l'email est dans `safe_emails` → pas de re-vérification, réservation directe en `pending`
- Si l'email est inconnu → vérification email obligatoire avant confirmation

### Schéma DB envisagé
```sql
CREATE TABLE safe_emails (
    email          TEXT PRIMARY KEY,
    reason         TEXT NOT NULL, -- 'verified' | 'marked_present'
    created_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Ordre de priorité suggéré

| Priorité | Fonctionnalité |
|---|---|
| 1 | Fermeture de jours + horaires dynamiques |
| 2 | Vérification email + table `safe_emails` |
| 3 | Présence / blacklist / fidélité |
| 4 | Graphiques admin |
| 5 | Refonte design admin |






voila ce sui a ete fait 



Tout est en place. Voici le résumé de ce qui a été fait :

Fichiers créés / modifiés :

Fichier Changement `hooks/useScrollDirection.ts` Nouveau hook — rAF + passive scroll, fallback scrollTop pour iOS `components/public/MobileBookingButton.tsx` Nouveau — bouton fixe en bas, se compacte au scroll, safe-area-inset `app/layout.tsx` Ajout de `<MobileBookingButton />` (se cache sur `/admin` via `usePathname`) `components/Navbar.tsx` Padding, logo et liens animés au scroll — mobile only `app/globals.css` Media query `max-width: 768px` — typo, cards, sections, `main pb-80px`, `input min-height: 48px` `components/BookingForm.tsx` `p-6 sm:p-8`, grille créneaux `grid-cols-2 sm:grid-cols-4`, barre de progression `h-[3px]`



Tout fonctionne. La structure confirme :

* Navbar : "Salon Élégance" + liens + "Réserver" présents (node [10]-[28])

* MobileBookingButton : bouton "Réserver" fixe visible en bas (node [327]) — séparé de la navbar

* Section coiffeurs : "Jihad" et "Mohamed" chargés dynamiquement depuis la DB (nodes [194]-[225])

* Aucune erreur dans les logs

Le serveur tourne sur port 3000. Les modifications mobile sont actives — teste sur iPhone ou via les DevTools Chrome (Vue mobile) pour voir le comportement scroll de la navbar et le bouton fixe.



dernier petit truc , le fps du bouton reserver est giiiiiga lent genre son animation c est pas du tout beau a voir tu peut regler l animation du bouton stp ? on dirait que ya 3 frame entre le bouton petit et le gros