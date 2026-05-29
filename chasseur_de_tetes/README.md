# Handoff : Chasseur de têtes — CRM de sourcing (COBOL & Java · Hauts-de-France)

## Overview
Outil interne de **chasse de têtes / sourcing** qui agrège des profils de développeurs (COBOL & Java, région Hauts-de-France) récupérés automatiquement par un script Python sur différentes job boards (GitHub, LinkedIn, Malt, Talent.io, Cooptalis, Dev.to, StackOverflow, Indeed, APEC, Freelance.com, etc.).

Le but de l'app : permettre à un recruteur de **parcourir, qualifier, suivre et contacter** ces profils. Elle offre 5 vues d'un même jeu de données (318 profils), un suivi de pipeline persistant, des notes, des favoris, un score explicité, l'édition d'un email d'approche et l'export CSV.

## About the Design Files
Les fichiers de ce bundle sont des **références de design réalisées en HTML/React (via Babel in-browser)** — un prototype fonctionnel montrant l'apparence et le comportement souhaités, **pas du code de production à copier tel quel**.

La tâche est de **recréer ce design dans l'environnement de la codebase cible** (React/Vue/Svelte + le design system existant), en réutilisant ses patterns, ses composants et son routing. S'il n'existe pas encore d'environnement, choisir le framework le plus adapté (recommandé : **React + Vite + TypeScript**, éventuellement TanStack Table pour la vue tableau et dnd-kit pour le kanban).

Le prototype charge les données depuis `data/profiles.js` (`window.PROFILES = [...]`). En production, ces données viendront du **fichier généré par le script Python** (JSON ou CSV) — voir « Modèle de données ».

## Fidelity
**Haute fidélité (hifi).** Couleurs, typographie, espacements, rayons, ombres et interactions sont définitifs et doivent être reproduits fidèlement. Tous les tokens proviennent du design system **Galaxie (France Télévisions)** — voir `colors_and_type.css` et la section « Design Tokens ».

---

## Modèle de données

Chaque profil est un objet plat. Champs (tous présents, certains vides `""`) :

| Champ | Type | Description | Exemple |
|---|---|---|---|
| `nom` | string | Nom complet | `"Loïc Mathieu"` |
| `tech` | `"Java"` \| `"COBOL"` | Techno principale | `"Java"` |
| `source` | string | Job board d'origine (peut finir par `" (public)"`) | `"LinkedIn (public)"` |
| `email` | string | Email public (souvent vide) | `"loik@gmail.com"` |
| `entreprise` | string | Société actuelle | `"kestra-io"` |
| `loc` | string | Localisation brute | `"Lille, France"` |
| `dispo` | `"Disponible"` \| `"Inconnu"` | Disponibilité | `"Inconnu"` |
| `date_dispo` | string | Date de dispo si connue | `""` |
| `bio` | string | Bio / titre profil | `"Lead Software Engineer…"` |
| `url` | string | Lien vers le profil source | `"https://github.com/…"` |
| `score` | number | Score de pertinence (0–10 observé, échelle affichée /15) | `10` |
| `email_sujet` | string | Objet d'email d'approche pré-généré | `"Opportunité Java — Lille"` |
| `email_corps` | string | Corps d'email pré-généré | `"Bonjour Loïc, …"` |

**Identité stable d'un profil** (`idOf`) : `url` s'il existe, sinon `` `n:${nom}|${source}|${entreprise}` ``. Utilisée comme clé pour le statut, les notes, les favoris et l'email édité. À conserver — certains profils n'ont pas d'`url`.

Volumétrie actuelle : **318 profils** (216 Java, 102 COBOL), 20 « Disponible », 46 avec email.

---

## Persistance

Tout l'état utilisateur est stocké en **`localStorage`** sous la clé `cdt_state_v2` :

```ts
{
  status: { [id]: "À contacter" | "Contacté" | "En attente" | "Retenu" | "Écarté" },
  notes:  { [id]: string },
  fav:    { [id]: true },
  emails: { [id]: { sujet: string, corps: string } }  // override du template
}
```

En production, remplacer par la couche de persistance de la codebase (API + DB) en gardant la même forme logique. Le statut par défaut d'un profil non encore touché est `"À contacter"`.

---

## Layout global

Structure verticale en `flex-column`, hauteur `100vh` :

1. **Topbar** (hauteur 60px, fond blanc, bordure basse `#e7e9ee`)
   - Bloc marque : carré 38×38 `border-radius:10px` fond `#0e1114`, icône crosshair blanche ; titre « Chasseur de têtes » (700, 15px) + sous-titre « COBOL & Java · Hauts-de-France » (11px `#9aa0ab`).
   - Champ de recherche (flex:1, max 560px) : fond `#f8f8f8`, `border-radius:10px`, icône loupe ; au focus → fond blanc + bordure bleue `#2c69f6` + halo `0 0 0 3px rgba(44,105,246,.14)`.
   - Chips stats à droite : « N profils » + « N dispos » (chip vert `rgba(11,153,98,.10)`).
   - Bouton **Export** (outline pill) → export CSV de la sélection (ou de la liste filtrée si rien n'est sélectionné).

2. **Subbar** (fond blanc, bordure basse) : à gauche le **sélecteur de vue** (segmented control, fond `#f8f8f8`, onglet actif = fond blanc + texte bleu + ombre `shadow-s`) ; à droite la **barre de filtres** (masquée sur la Vue d'ensemble).

3. **Content** (`flex:1`, `min-height:0`) : la vue active.

4. **Footer** (hauteur 34px, fond blanc, bordure haute) : centré, « Designé avec ❤️ par Loulou », 12px `#9aa0ab`.

5. Superpositions : **Drawer** de détail (droite), **Bulk bar** (bas centre), **Toast** (bas centre).

---

## Filtres (barre de la subbar, hors Vue d'ensemble)

- Select **techno** : Toutes / Java / COBOL
- Select **disponibilité** : Toute / Disponibles / Dispo. inconnue
- Select **source** : Toutes + liste dédupliquée des sources (label court, sans « (public) »)
- Select **statut** : Tout + les 5 statuts
- Select **score min** : Tous / ≥3 / ≥5 / ≥7
- Toggle **Favoris** (chip ; actif = fond `rgba(255,165,31,.12)`, bordure `#ffc300`, texte `#b07a00`)
- Lien **Réinitialiser** (visible si au moins un filtre actif)
- Compteur de résultats à droite

La recherche texte (topbar) matche sur `nom + email + loc + entreprise + bio + source` (insensible à la casse). Filtres et recherche se combinent (ET logique). La liste filtrée est triée par `score` décroissant pour les vues Liste / Cartes (le Tableau gère son propre tri).

---

## Vues / écrans

### 1. Vue d'ensemble (Dashboard)
Scrollable, padding 22/24px. Utilise **tous** les profils (vue globale, ignore les filtres).
- **Rangée de 5 KPI** (`grid` 5 col, cartes `border-radius:14px`, bordure `#e7e9ee`) : Profils sourcés (accent `#0e1114`), Disponibles (`#0b9962`), Emails trouvés (`#2c69f6`), Priorité score≥5 (`#fa794e`), Dans le pipeline (`#b748ab`). Valeur en `font-brand` 32px/800.
- **Grille de panneaux** 3 colonnes (`gap:14px`) :
  - **Pipeline** (span 2) : histogramme « funnel » des 5 statuts, barres colorées par statut, cliquable → ouvre le kanban.
  - **Répartition par techno** : 2 BarRow (Java bleu, COBOL orange) + légende %.
  - **Distribution des scores** : histogramme par buckets `0 / 1–2 / 3–4 / 5–6 / 7+`, couleur = `scoreColor(bucket bas)`.
  - **Top sources** : BarRow (max 8), clic → vue Tableau filtrée sur la source.
  - **Top localisations** : BarRow (max 8, couleur `#007a97`), clic → Tableau avec recherche = ville.
  - **Profils prioritaires** (span 3) : 6 cartes (tri score → dispo → email), clic → ouvre le drawer.
- KPI passe en 2 col sous 1100px ; dash-grid en 2 col.

### 2. Liste (master-détail)
- Colonne gauche (largeur 366px, scroll, fond blanc) : liste de `ProfileRow`.
- Colonne droite : `ProfileDetail` inline (sans bouton fermer ; flèches préc./suiv.).
- **Navigation clavier** ↑/↓ pour changer de profil sélectionné (ignorée si focus dans un input/textarea/select).
- `ProfileRow` : avatar 38px, nom (700, 13.5px) + étoile si favori, sous-ligne ville/entreprise/source, badges (techno, dispo, pastille email, statut si ≠ « À contacter »), `ScoreChip` à droite. Item actif : fond `rgba(44,105,246,.07)` + bordure gauche 3px couleur techno.

### 3. Tableau
- Table dense (`font-size:13px`), en-têtes **collants** (`position:sticky`), fond `#fbfcfd`.
- Colonnes : checkbox (sélection), étoile favori, **Nom** (avatar 28 + nom), **Tech**, **Score** (centré, coloré), **Dispo.** (point vert / tiret), **Localisation**, **Entreprise**, **Source**, **Statut** (select inline).
- **Tri** en cliquant l'en-tête (icône chevron/sort) ; texte trié en `fr` via `localeCompare`, numérique pour score/dispo. Défaut : score décroissant.
- Case d'en-tête = tout sélectionner/désélectionner les lignes visibles.
- Clic sur une ligne → ouvre le **drawer**. Clic sur checkbox / select statut → `stopPropagation`.

### 4. Pipeline (Kanban)
- 5 colonnes (statuts), `overflow-x:auto`, colonnes `min-width:244px` fond `#f0f2f5`.
- En-tête de colonne : pastille couleur + titre (couleur statut) + compteur (pill blanche).
- Cartes (`KanbanCard`) triées par score décroissant, bordure gauche 3px couleur techno.
- **Glisser-déposer** (HTML5 drag&drop) d'une carte vers une colonne → change le statut (persisté). Colonne survolée : fond bleuté + `inset 0 0 0 2px #2c69f6`. Colonne vide : zone pointillée « Déposez un profil ici ».
- Clic sur une carte → drawer.

### 5. Cartes
- Grille `auto-fill minmax(280px, 1fr)`, gap 14px.
- Carte : avatar 44 + `ScoreChip` en haut, nom (800, 15.5px), sous-infos (entreprise, ville), bio tronquée 2 lignes, pied (badges techno/dispo + étoile favori), pied bas avec pastille statut. Hover : translateY(-2px), ombre `shadow-m`, liseré techno en haut.

---

## Composants partagés

- **Icon** : SVG inline `viewBox 0 0 24 24`, stroke 1.6, style Lucide. Dictionnaire de chemins (`ICONS`) dans `components.jsx` (search, star, mail, copy, check, x, chevDown/Right, dashboard, list, table, kanban, grid, download, filter, pin, building, edit, user, source, crosshair, reset, send, sort, briefcase, clock, flame, arrowRight…). En prod, remplacer par la lib d'icônes de la codebase (Lucide recommandé).
- **Avatar** : cercle, initiales (2 lettres), fond = couleur techno (`Java #2c69f6`, `COBOL #fa794e`), option `ring` (halo `0 0 0 3px` teinte douce).
- **TechBadge** : pastille `border-radius:4px`, point + label, couleur techno sur fond teinté doux.
- **DispoBadge** : « Disponible » (vert) avec point, ou « Dispo. inconnue » (gris).
- **ScoreChip** : carré arrondi `border-radius:9px`, fond = `scoreColor(score)`, chiffre blanc 800. Tailles s/m/l.
- **StatusPill** : pill `border-radius:9999px`, point + libellé, couleur du statut sur fond teinté.
- **StarBtn** : bouton favori (étoile pleine `#ffc300` si actif, sinon contour gris).
- **StatusSelect** : select stylé en pill bordée de la couleur du statut.
- **ScoreBreakdown** : grille 2 col des signaux du score (pastille check vert si présent, sinon croix grise).
- **ProfileDetail** : fiche complète (utilisée en drawer ET en master-détail) — voir ci-dessous.

### ProfileDetail (drawer / master-détail)
- **En-tête** (`dt-head`, fond blanc, liseré haut 3px couleur techno) : avatar 56 (ring), nom 19px/800, sous-ligne (entreprise + source), `StarBtn`. Rangée méta : `TechBadge` + `DispoBadge` + `StatusSelect`. En drawer : flèches préc./suiv. + bouton fermer. `Échap` ferme le drawer.
- **Carte Score** : `ScoreChip` taille l + « X/15 » + libellé (`scoreLabel`) coloré ; puis « Pourquoi ce score » → `ScoreBreakdown`.
- **Carte Coordonnées & profil** : grille de champs (Localisation, Entreprise, Email cliquable `mailto:` ou « Non public », Source, Disponible le si présent) ; bio dans un encart `#f8f8f8` à liseré gauche ; actions « Voir le profil » (lien `url`, bouton bleu) + « Marquer contacté » (passe le statut à « Contacté »).
- **Carte Notes privées** : `textarea` liée à `notes[id]`.
- **Carte Email d'approche** (si template présent) : badge « éditable », champ Objet + textarea Corps (liés à `emails[id]`, override du template), boutons « Copier » (copie `Objet : … \n\n …` dans le presse-papier → toast) et « Ouvrir dans la messagerie » (`mailto:` avec sujet/corps encodés, si email présent).

---

## Score expliqué (`scoreSignals`)

Le score est fourni par le script Python ; l'UI le **rend lisible** en recalculant les signaux présents (booléens) à partir des champs :

| Signal | Condition (regex/insensible casse sur `bio`/`source`/`loc`) |
|---|---|
| Disponibilité confirmée | `dispo === "Disponible"` |
| Email public trouvé | `email` non vide |
| Séniorité détectée | bio matche `lead\|senior\|principal\|staff\|architect…\|10+\|15 ans\|20 ans` |
| Stack pertinent | bio matche `java\|spring\|quarkus\|jvm\|kotlin\|cobol\|mainframe\|jcl\|cics\|db2\|z/os\|hibernate\|microservice…` |
| Localisation précise | `loc` non vide et ≠ « Hauts-de-France » seul |
| Canal à forte intention | source matche `malt\|talent.io\|cooptalis\|freelance\|codeur\|indeed\|apec\|cv` |

`scoreColor` : ≥7 `#0b9962` · ≥5 `#2c69f6` · ≥3 `#ffa51f` · ≥1 `#fa794e` · 0 `#b5b5b5`.
`scoreLabel` : ≥7 « Priorité haute » · ≥5 « À étudier » · ≥3 « Potentiel » · ≥1 « Faible signal » · 0 « À qualifier ».

---

## Actions de masse (Bulk bar)

Apparaît (animation slide-up) dès qu'≥1 ligne est cochée dans le Tableau. Fond `#0e1114`, texte blanc, pill `border-radius:14px`, centrée en bas.
- Compteur « N sélectionné(s) ».
- Select **Statut** (sombre) : applique un statut à toute la sélection (→ toast).
- Bouton **Exporter** : CSV de la sélection.
- Bouton fermer : vide la sélection.

## Export CSV (`exportCSV`)
Colonnes : Nom, Tech, Score, Disponibilité, Localisation, Entreprise, Source, Email, Statut, Favori, Notes, URL. Séparateur `,`, valeurs entre guillemets (`"` échappé en `""`), BOM UTF-8 (`\uFEFF`), fin de ligne `\r\n`. Nom de fichier : `chasseur-de-tetes-YYYY-MM-DD.csv`.

---

## Interactions & comportements
- **Hover boutons** : `translateY(-1px)` ; **active** : `scale(.98)` ; transition `.16s cubic-bezier(.2,.8,.2,1)`.
- **Drawer** : scrim `rgba(14,17,20,.32)`, panneau 488px (max 92vw) qui glisse de la droite (`transform translateX`, `.24s`). Fermeture par scrim, bouton X ou `Échap`.
- **Toast** : pill verte `#0b9962` en bas centre, slide-up, auto-masquée après ~2,2s.
- **Navigation clavier** : ↑/↓ dans la vue Liste ; ←/→ via les flèches du drawer.
- **Drag&drop** kanban : feedback visuel sur la colonne cible.
- **Responsive** : sous 1100px, KPI et dash-grid en 2 colonnes, chips stats masquées.

## State management (prototype)
État local React (`useState`) au niveau `App` : `view`, `q`, `tech`, `dispo`, `source`, `status`, `scoreMin`, `favOnly`, `drawerId`, `selected` (Set d'ids), `toastMsg`. Hook `useStore()` = état persistant (status/notes/fav/emails) synchronisé en `localStorage` via `useEffect`. `filtered`/`sortedFiltered` sont des `useMemo`. En prod : mapper sur le state management de la codebase (Redux/Zustand/Context/serveur).

---

## Design Tokens (Galaxie · France Télévisions)

Définis dans `colors_and_type.css` (à conserver ou mapper sur le DS de la codebase).

**Couleurs clés**
- Bleu primaire `#2c69f6` (hover `#1e54d6`) — actions, liens, Java.
- Orange `#fa794e` — COBOL, priorité.
- Vert succès `#0b9962` (texte `#037115`) — disponibilité, retenu, toast.
- Ambre `#ffa51f`, jaune `#ffc300` — en attente, favori.
- Rouge `#d0021b` — écarté.
- Violet `#b748ab` — pipeline (accent KPI), cyan `#007a97` — localisations.
- Neutres : encre `#0e1114`/`#14181d` (texte), `#5d636e` (texte 2), `#9aa0ab` (texte 3), fond app `#f5f6f8`, surfaces `#fff`, lignes `#e7e9ee` / `#eef0f3`, gris doux `#f8f8f8`.

**Statuts** : À contacter `#636466` · Contacté `#2c69f6` · En attente `#ffa51f` · Retenu `#0b9962` · Écarté `#d0021b` (chaque statut a une teinte de fond douce associée).

**Typo** : `--font-brand`/`--font-body` = **FranceTV Brown** (Regular 400 / Bold 700 / Black 900 + Italic), fournie dans `fonts/`. Fallbacks système. Display KPI/score en font-brand. Échelle : titres 15–19px, corps 13–14px, captions 11–12px.

**Rayons** : 4 (badges) · 8/9 (champs, boutons icône) · 10/11 · 14 (cartes/panneaux) · 9999 (pills). 
**Ombres** : `shadow-s` `0 1px 2px/3px rgba(14,17,20,.06/.10)` · `shadow-m` · `shadow-l`. 
**Espacements** : échelle 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.

---

## Assets
- **Police FranceTV Brown** : `fonts/FranceTVBrown-{Regular,Bold,Italic,Black}.otf` (licence France Télévisions — à remplacer par la police de marque de la codebase si différente).
- **Icônes** : SVG inline maison (style Lucide). Recommandation : utiliser **Lucide** dans la codebase.
- **Avatars** : générés (initiales sur fond coloré) — aucune image externe.
- **Aucune image bitmap** dans le design.

## Files (dans ce bundle)
- `Chasseur de têtes.html` — shell : charge les CSS, React/Babel, puis les scripts dans l'ordre.
- `colors_and_type.css` — tokens Galaxie (couleurs, typo, espacements, rayons, ombres).
- `fonts/` — FranceTV Brown (.otf).
- `data/profiles.js` — `window.PROFILES` (318 profils ; exemple de jeu de données).
- `app/store.jsx` — helpers (`idOf`, `scoreSignals`, `scoreColor`, statuts, `exportCSV`) + hook `useStore` (localStorage).
- `app/components.jsx` — Icon, Avatar, badges, ScoreChip, StatusPill, StarBtn, StatusSelect, ScoreBreakdown.
- `app/detail.jsx` — `ProfileDetail`.
- `app/dashboard.jsx` — Vue d'ensemble.
- `app/views.jsx` — Liste, Tableau, Cartes, ProfileRow, Empty.
- `app/pipeline.jsx` — Kanban.
- `app/app.jsx` — shell React (topbar, filtres, routing des vues, drawer, bulk bar, toast, footer).
- `app/styles.css` — styles de l'app.

### Ordre de chargement des scripts (important)
`data/profiles.js` → React → ReactDOM → Babel → `store.jsx` → `components.jsx` → `detail.jsx` → `dashboard.jsx` → `views.jsx` → `pipeline.jsx` → `app.jsx`. Les fichiers `.jsx` exposent leurs symboles sur `window` (scopes Babel séparés dans le prototype) ; en production, utiliser de vrais imports ES modules.
