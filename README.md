# Omedys Cartographie

Cartographie interactive des sites de télémédecine du réseau Omedys — cabinets TMS et salles partenaires — avec filtres multi-critères, recherche géolocalisée et mode embed configurable.

---

## Arborescence

```
(racine)
├── index.html              → Application principale
├── index.embed.html        → Version embed (iframe)
│
assets/
└── style.css               → Design system complet (glassmorphisme)
│
data/
├── index.json              → Manifeste des datasets
├── zones.json              → Régions et départements français
└── json/
    ├── cabinets.json       → 15 cabinets TMS
    └── salles.json         → 403 salles de télémédecine
│
js/
├── main.js                 → Point d'entrée — application principale
├── main.embed.js           → Point d'entrée — version embed
│
├── core/
│   ├── config.js           → Couleurs, statuts, types de sites
│   ├── store.js            → État global (sites, markers, filtres)
│   └── theme.js            → Gestion thème light/dark/system
│
├── data/
│   ├── data.loader.js      → Chargement des JSON via index.json
│   ├── parser.cabinets.js  → Normalisation des données cabinets
│   └── parser.salles.js    → Normalisation des données salles
│
├── map/
│   └── map.engine.js       → Moteur Leaflet — rendu et filtrage
│
└── ui/
    ├── popup.bp3.js        → Popup glassmorphisme BP3
    ├── ui.filters.js       → Panneau filtres multi-critères
    ├── ui.search.js        → Barre de recherche + autocomplétion
    ├── ui.stats.js         → Compteur de sites affichés
    └── ui.theme.js         → Sélecteur de thème (UI)
```

---

## Stack technique

| Brique | Rôle |
|---|---|
| [Leaflet 1.9.4](https://leafletjs.com) | Carte interactive |
| [Leaflet.MarkerCluster 1.5.3](https://github.com/Leaflet/Leaflet.markercluster) | Regroupement des salles |
| [Font Awesome 6.5.1](https://fontawesome.com) | Icônes monochrome |
| [DM Sans](https://fonts.google.com/specimen/DM+Sans) | Typographie |
| [geo.api.gouv.fr](https://geo.api.gouv.fr) | Autocomplétion communes |
| ES Modules natifs | Pas de bundler, import/export directs |

---

## Données

### Cabinets TMS (`data/json/cabinets.json`)
15 sites — points structurants du réseau, affichés avec un marqueur FA pulsé, jamais clusterisés.

| Champ | Description |
|---|---|
| `Name` | Nom du cabinet (ex: TMS 14) |
| `Statut` | `Ouvert` · `Ouverture en cours` · `Virtuel` |
| `Location` | Objet `{lat, lng, address, city}` |
| `ATT_Name` | Référent du cabinet |
| `ATT_Mail` | Email du référent |
| `ATT_Phone` | Téléphone |
| `MSS` | Messagerie Sécurisée de Santé |

### Salles (`data/json/salles.json`)
403 sites — salles partenaires, clusterisées sur la carte.

| Champ | Description |
|---|---|
| `Name` | Nom de la salle |
| `Statut_Salle` | `Ouvertes` · `Ouverture en cours` · `Telesecretariat OMEDYS` |
| `Type` | Type de structure (voir liste ci-dessous) |
| `TMS` | Cabinet TMS rattaché |
| `Location` | Objet `{lat, lng, address, city}` |
| `ATT` | Référent |
| `ATT_Mail` | Email |
| `Phone` | Téléphone |
| `MSS` | Messagerie Sécurisée de Santé |

**Types de sites disponibles :**
`ESMS` · `CDS/MSP/CM` · `CPTS` · `Cabinet Infirmier` · `Pharmacie` · `Laboratoire` · `Salle` · `Salle collectivité` · `ODYS` · `Etablissement scolaire` · `Foyer d'accueil` · `Domicile` · `Vehicule de télémédecine assistée`

**TMS disponibles :**
`TMS 10` · `TMS 11` · `TMS 14` · `TMS 18` · `TMS 26` · `TMS 28` · `TMS 31` · `TMS 41` · `TMS 54` · `TMS 55` · `TMS 59` · `TMS 72` · `TMS ESMS (cabinet virtuel)` · `TMS ESMS Emeis`

### index.json
Manifeste contrôlant quels datasets sont chargés au démarrage :
```json
[
  { "label": "Cabinets TMS", "file": "/data/json/cabinets.json", "visible": true },
  { "label": "Salles",       "file": "/data/json/salles.json",   "visible": true }
]
```

---

## Application principale

### Démarrage
```
index.html → main.js
  ├── initTheme()          → applique le thème sauvegardé avant tout rendu
  ├── loadData()           → charge cabinets.json + salles.json via index.json
  ├── MapEngine()          → initialise Leaflet + rendu des marqueurs
  ├── initFilters(map)     → construit le panneau filtres + bento UI
  ├── initSearch(map)      → barre de recherche + suggestions
  ├── initStats()          → compteur de sites visibles
  └── initThemeSwitcher()  → tile de sélection de thème
```

### UI Bento
Interface en panneaux glassmorphiques positionnée en haut à gauche :

```
┌──────┬──────────────────────────────────────┐
│  ☰   │  🔍 Rechercher une ville, un CP…    │
└──────┴──────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│           SITES AFFICHÉS  404               │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  [Panneau filtres — s'ouvre au clic ☰]      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│  Apparence    ☀️ Clair  🌙 Sombre  ⚙️ Auto  │
└─────────────────────────────────────────────┘
```

### Filtres disponibles

| Section | Critères |
|---|---|
| Dataset | Cabinets TMS · Salles |
| Statut cabinets | Ouvert · Ouverture en cours · Virtuel |
| Statut salles | Ouvertes · Ouverture en cours · Telesecretariat OMEDYS |
| Type de site | 14 types (CPTS, Pharmacie, ESMS…) |
| Cabinet TMS | Par TMS rattaché |
| Région | 13 régions françaises |
| Département | 101 départements |

### Recherche
- Frappe avec debounce 250ms
- Recherche locale d'abord (nom, ville, département)
- Puis `geo.api.gouv.fr` pour les communes par nom ou code postal
- Highlight du terme cherché dans les suggestions
- Positionnement dynamique via `getBoundingClientRect()` — fonctionne en app et en embed

### Marqueurs
- **Cabinets** : `L.divIcon` avec icône `fa-briefcase-medical` + halo pulsé animé — sur `L.layerGroup` indépendant, jamais clusterisé, `zIndexOffset: 1000`
- **Salles** : `L.circleMarker` sur `L.markerClusterGroup`
- Couleur = statut du site

### Thème
3 modes persistés en `localStorage` (`omedys-theme`) :
- `light` — glassmorphisme clair
- `dark` — glassmorphisme sombre
- `system` — suit `prefers-color-scheme` en temps réel

Le thème est appliqué via `data-theme` + classe `.is-dark` sur `<html>` avant tout rendu pour éviter le flash.

---

## Version embed

### Usage
```html
<iframe
  src="/index.embed.html"
  width="100%"
  height="500"
  frameborder="0"
  style="border-radius: 16px;">
</iframe>
```

### Configuration — `EMBED_CONFIG`
L'objet `window.EMBED_CONFIG` défini dans `index.embed.html` contrôle les sites affichés.

**Règle fondamentale : si aucun filtre n'est défini, rien ne s'affiche.**

```js
window.EMBED_CONFIG = {

  // "cabinet" | "salle" — au moins un requis
  dataset: ["cabinet", "salle"],

  // TMS rattaché (salles uniquement) — [] = tous
  tms: [],

  // Type de site (salles uniquement) — [] = tous
  typeSite: [],

  // Statut cabinets — [] = tous
  statusCabinet: ["Ouvert", "Ouverture en cours"],

  // Statut salles — [] = tous
  statusSalle: ["Ouvertes", "Ouverture en cours"],

}
```

### Exemples de configurations

**Cabinets ouverts uniquement :**
```js
window.EMBED_CONFIG = {
  dataset:       ["cabinet"],
  tms:           [],
  typeSite:      [],
  statusCabinet: ["Ouvert"],
  statusSalle:   [],
}
```

**Salles CPTS et Pharmacies rattachées au TMS 14 :**
```js
window.EMBED_CONFIG = {
  dataset:       ["salle"],
  tms:           ["TMS 14"],
  typeSite:      ["CPTS", "Pharmacie"],
  statusCabinet: [],
  statusSalle:   ["Ouvertes"],
}
```

**Carte complète (cabinets + salles actives) :**
```js
window.EMBED_CONFIG = {
  dataset:       ["cabinet", "salle"],
  tms:           [],
  typeSite:      [],
  statusCabinet: ["Ouvert", "Ouverture en cours"],
  statusSalle:   ["Ouvertes", "Ouverture en cours"],
}
```

### Différences avec l'application principale

| Fonctionnalité | App | Embed |
|---|---|---|
| Marqueurs | ✅ | ✅ |
| Popups | ✅ | ✅ |
| Recherche | ✅ | ✅ |
| Filtres UI | ✅ | ❌ (config JS) |
| Compteur | ✅ | ❌ |
| Sélecteur de thème | ✅ | ❌ |
| Filtres dynamiques | ✅ | ❌ (statiques) |

---

## Design system

Le fichier `assets/style.css` est partagé entre l'app et l'embed.

### Glassmorphisme
```css
background: rgba(255, 255, 255, 0.28);
backdrop-filter: blur(24px) saturate(160%);
border: 1px solid rgba(255, 255, 255, 0.18);
box-shadow: 0 24px 64px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12);
```

### Tokens CSS
```css
--primary        /* #009597 — teal Omedys */
--glass-bg       /* fond semi-transparent */
--glass-border   /* bordure subtile */
--shadow-float   /* ombre profonde + inset highlight */
--text-primary   /* texte principal */
--text-secondary /* texte secondaire */
--item-bg        /* fond des items filtres */
```

### Thème dark
Toutes les règles dark utilisent `html.is-dark` (classe posée par `theme.js`) plutôt que `@media prefers-color-scheme` — ce qui garantit que le choix utilisateur override le système sur tous les composants, y compris les popups Leaflet.

---

## Déploiement

Le projet est statique — aucun backend requis. Servir depuis n'importe quel serveur HTTP à la racine `/`.

```
nginx / Apache / Vercel / Netlify / GitHub Pages
```

Les chemins sont absolus (`/assets/style.css`, `/data/json/…`) — s'assurer que la racine du serveur correspond à la racine du projet.
