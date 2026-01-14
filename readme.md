# 🗺️ Omedys Maps

Application interactive de cartographie pour visualiser et explorer tous les cabinets, salles et établissements du réseau Omedys en France.



---

## ✨ Fonctionnalités

- 🗺️ **Carte interactive** avec 2000+ sites Omedys (cabinets, ESMS, salles, pharmacies...)
- 🔍 **Recherche par ville** - Tapez un lieu et la carte zoom automatiquement
- 🏥 **Filtres dynamiques** - Par statut (Cabinet Ouvert, En cours, Télésecrétariat, ESMS...)
- 📞 **Informations complètes** - Type, responsable, téléphone, adresse dans les popups
- 📱 **Design responsive** - Fonctionne sur desktop, tablette et mobile
- 🎨 **Design Bento moderne** - UI contemporaine avec glassmorphism et animations fluides
- ⚡ **Performance optimisée** - Marqueurs légers, chargement rapide des données

---

## 🚀 Démarrage rapide

### Prérequis
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Un serveur web local (optionnel pour développement)

### Installation locale

```bash
# 1. Cloner le repository
git clone https://github.com/ArnaudPantaleon/OmedysMaps.git
cd OmedysMaps

# 2. Démarrer un serveur local

# Avec Python 3
python -m http.server 8000

# Avec Python 2
python -m SimpleHTTPServer 8000

# Avec Node.js (si installé)
npx http-server

# Avec PHP
php -S localhost:8000
```

3. **Ouvrir dans le navigateur** : http://localhost:8000

---

## 📁 Structure du projet

```
OmedysMaps/
├── index.html          # Page principale
├── script.js           # Logique Leaflet & interactions
├── style.css           # Styling Bento-style
├── cabinet.json        # Données des 12 cabinets TMS
├── salles.json         # Données des 1000+ salles & établissements
├── zones.json          # Régions & départements (pour filtrage futur)
├── README.md           # Ce fichier
└── LICENSE             # Licence du projet
```

---

## 🎮 Guide d'utilisation

### Navigation sur la carte
- **Zoom** : Roulette souris ou + / -
- **Pan** : Cliquer-glisser
- **Double-clic** : Zoom en

### Rechercher une ville
1. Tapez une adresse dans la barre "Ville, CP..."
2. Appuyez sur **Entrée** ou cliquez sur 🔍
3. La carte zoom automatiquement sur le lieu

### Filtrer les sites
1. Cliquez le bouton **☰** (menu) en haut à gauche
2. Cochez/décochez les statuts :
   - 🟢 **Cabinet Omedys** - Nos 12 cabinets TMS
   - 🟢 **Salles Ouvertes** - Salles de télémédecine opérationnelles
   - 🟣 **Télésecrétariat** - Sites avec support télésecrétariat
   - 🔵 **En cours** - Ouvertures en préparation
   - 🔳 **Afficher ESMS** - EHPAD, maisons de retraite, foyers...

3. Le compteur **"SITES AFFICHÉS"** se met à jour en temps réel

### Consulter les détails
1. **Cliquez sur un marqueur** pour ouvrir la popup
2. Informations disponibles :
   - Nom du site
   - Type (Cabinet, EHPAD, Pharmacie...)
   - Responsable/ATT
   - Téléphone (formaté automatiquement)
   - Adresse complète

---

## 🛠️ Technologies utilisées

| Technologie | Usage |
|---|---|
| **Leaflet.js** | Cartographie interactive |
| **OpenStreetMap** | Fond de carte |
| **API adresse.gouv.fr** | Géocodage France (recherche) |
| **Plus Jakarta Sans** | Typographie moderne |
| **Vanilla JavaScript** | Zéro dépendance |

---

## 📊 Données

### Sources
- `cabinet.json` : 12 cabinets TMS avec coordonnées GPS
- `salles.json` : ~1000 sites (ESMS, pharmacies, cabinets infirmiers, salles...)
- `zones.json` : Régions & départements français (setup pour filtrage futur)

### Champs disponibles
```json
{
  "Name": "CABINET TMS 10",
  "Address": "2 Rue Gustave Eiffel, 10430 Rosières-près-Troyes",
  "Phone": "09 78 81 00 38",
  "Type": "CABINET",
  "ATT": "Aurelie HUGOT-JEANNARD",
  "TMS": "TMS 10",
  "Statut": "Ouvert",
  "Latitude": 48.270438,
  "Longitude": 4.077274
}
```

### ⚠️ Données manquantes
- ~500 sites sans coordonnées GPS (affichage impossible)
- Quelques champs vides (téléphone, adresse)
- Mise à jour manuelle (pas de sync automatique)

---

## 🎨 Design & Customisation

### Couleurs des statuts
```css
--primary: #009597              /* Cabinets Omedys */
#2ecc71                         /* Salles ouvertes (vert) */
#8956FB                         /* Télésecrétariat (violet) */
#3498db                         /* En cours (bleu) */
#1e293b                         /* ESMS (gris foncé) */
```

### Modifier le zoom initial
```javascript
// Dans script.js, ligne ~12
let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
//                                                                          ↑ zoom (1-18)
```

### Changer le fond de carte
```javascript
// Remplacer par une autre source OSM
L.tileLayer('https://{s}.basemaps.cartocdn.com/positron/{z}/{x}/{y}{r}.png').addTo(map);
// ou MapBox, Google Maps, etc.
```

---

## 🔧 Développement

### Ajouter un nouveau filtre
```javascript
// Dans script.js, CONFIG.status
"Mon Filtre": { 
  color: "#hex_color", 
  label: "Affichage", 
  checked: true 
}
```

### Ajouter une nouvelle source de données
```javascript
// Modifier la fonction startApp()
const [salles, cabinets, nouvelle] = await Promise.all([
  fetch('salles.json').then(r => r.json()),
  fetch('cabinet.json').then(r => r.json()),
  fetch('nouvelle.json').then(r => r.json())  // ← Ajouter ici
]);
```

### Validation des données
```bash
# Script Python pour valider les coordonnées GPS
python3 validate_data.py
```

---

## 📈 Performance & Optimisations

### Situation actuelle
- ✅ 2000+ marqueurs légers (CircleMarker)
- ✅ Chargement JSON async
- ⚠️ Pas de clustering (densité élevée en zones urbaines)
- ⚠️ Toutes les données chargées au démarrage

### Prochaines optimisations
- [ ] Clustering avec Leaflet.MarkerCluster
- [ ] Pagination des données
- [ ] Lazy loading des popups
- [ ] Service Worker pour cache offline
- [ ] Compression gzip

---

## 🐛 Troubleshooting

### La carte ne s'affiche pas
```
✓ Vérifier que vous êtes sur http:// (pas file://)
✓ Ouvrir la console (F12) pour voir les erreurs
✓ Vérifier que le fichier index.html est à la racine
```

### Les marqueurs ne s'affichent pas
```
✓ Vérifier que cabinet.json et salles.json sont chargés (Network tab)
✓ Vérifier que les coordonnées Latitude/Longitude sont valides
✓ Peut être caché par les filtres (vérifier la barre latérale)
```

### La recherche ne fonctionne pas
```
✓ Vérifier la connexion internet (API adresse.gouv.fr)
✓ Essayer avec un nom de ville exact
✓ Vérifier la console pour CORS errors
```

### Lenteur sur mobile
```
✓ Désactiver les ESMS pour réduire les marqueurs
✓ Utiliser un téléphone plus récent
✓ Fermer les autres onglets
```

---

## 📱 Compatibilité

| Navigateur | Desktop | Mobile |
|---|---|---|
| Chrome | ✅ Excellent | ✅ Excellent |
| Firefox | ✅ Excellent | ✅ Bon |
| Safari | ✅ Excellent | ✅ Bon |
| Edge | ✅ Excellent | ✅ Bon |
| IE 11 | ❌ Non supporté | - |

---

## 🔒 Sécurité & Confidentialité

- ✅ Données publiques uniquement (adresses, téléphones publics)
- ✅ HTTPS obligatoire sur production
- ✅ Pas de tracking utilisateur
- ✅ Pas de authentification (accès libre)
- ⚠️ API adresse.gouv.fr log les recherches (légal en FR)

---

## 📝 Licence

Ce projet est sous licence **LGPL-3.0** (GNU Lesser General Public License).

Cela signifie que vous pouvez :
- ✅ Utiliser le projet librement
- ✅ Modifier le code
- ✅ Redistribuer le code modifié
- ✅ Utiliser dans des projets commerciaux
- ⚠️ Vous devez partager les modifications du code Omedys Maps
- ⚠️ Mentionner la licence et les auteurs

Voir le fichier [LICENSE](LICENSE) pour les détails complets.

---

## 👨‍💻 Contributeurs

- **Arnaud Pantaléon** - Créateur
- **Arnaud Pantaléon** - Maintenance

---

## 🎯 Roadmap

### Phase 1 (Court terme)
- [x] Carte interactive fonctionnelle
- [x] Filtres par statut
- [x] Recherche par ville
- [ ] Clustering des marqueurs
- [ ] Données GPS complètes (500 sites manquants)

### Phase 2 (Moyen terme)
- [ ] Filtrage par type (EHPAD, Pharmacie...)
- [ ] Filtrage par région/département
- [ ] Export données (CSV, GeoJSON)
- [ ] Système de favoris
- [ ] localStorage pour persistance filtres

### Phase 3 (Long terme)
- [ ] Backend pour mise à jour auto des données
- [ ] Authentification (pour données privées)
- [ ] Historique des changements de statut
- [ ] API REST pour intégration externe
- [ ] App mobile native

---

## 💬 Support & Questions

**Signaler un bug :**
1. Ouvrir une issue sur GitHub
2. Décrire le problème avec screenshot
3. Indiquer votre navigateur/appareil

**Suggérer une fonctionnalité :**
1. Créer une discussion GitHub
2. Décrire le cas d'usage
3. Partager votre feedback

**Contacter l'équipe :**
- Email : [À définir]
- GitHub : https://github.com/ArnaudPantaleon/OmedysMaps

---

## 📚 Ressources utiles

- [Documentation Leaflet.js](https://leafletjs.com/reference.html)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [API adresse.gouv.fr](https://adresse.data.gouv.fr/)
- [Déployer sur Netlify](https://www.netlify.com/)
- [Déployer sur GitHub Pages](https://pages.github.com/)

---

## ⭐ Merci !

Si vous trouvez ce projet utile, n'hésitez pas à :
- ⭐ Mettre une star sur GitHub
- 🔗 Partager le lien
- 💬 Donner du feedback
- 🐛 Signaler les bugs

**Dernière mise à jour :** Janvier 2026  
**Version :** 1.0.0
