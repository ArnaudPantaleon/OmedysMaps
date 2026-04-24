import { CONFIG }      from "../core/config.js"
import { store }       from "../core/store.js"
import { updateStats } from "../ui/ui.stats.js"
import { openSitePanel } from "../ui/ui.panel.js"
import { setTheme, getTheme } from "../core/theme.js"

import { CONFIG } from "../core/config.js"
import { store } from "../core/store.js"
// ... tes autres imports

export class MapEngine {
  constructor() {
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const isMobile = mediaQuery.matches
    const initialZoom = isMobile ? CONFIG.map.mobileZoom : CONFIG.map.zoom

    // Déterminer le thème initial
    let initialTheme = getTheme()
    if (initialTheme === "system") {
      initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }

    // Initialisation du moteur Vectoriel
    this.map = new maplibregl.Map({
      container: 'map',
      style: initialTheme === "dark" ? CONFIG.map.themedark : CONFIG.map.themelight,
      center: CONFIG.map.center,
      zoom: initialZoom,
      antialias: true
    });

    // Équivalent du cluster Leaflet (version simple via marqueurs HTML)
    this.markers = [];

    this.map.on('load', () => {
      this.renderSites();
    });

    // Gestion du responsive
    mediaQuery.addEventListener("change", e => {
      this.map.setZoom(e.matches ? CONFIG.map.mobileZoom : CONFIG.map.zoom)
    });
  }

  updateTheme(theme) {
    let target = theme;
    if (theme === 'system') {
      target = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    const newStyleUrl = target === 'dark' ? CONFIG.map.themedark : CONFIG.map.themelight;
    
    // Switch de style vectoriel (ultra rapide)
    this.map.setStyle(newStyleUrl);
  }

  renderSites() {
    // On nettoie les anciens marqueurs
    this.markers.forEach(m => m.remove());
    this.markers = [];
    store.markers.length = 0;

    store.sites.forEach(site => {
      if (!this._isVisible(site)) return;

      const color = site.type === "cabinet"
        ? (CONFIG.statusCabinet?.[site.status]?.color || "#94a3b8")
        : (CONFIG.statusSalle?.[site.status]?.color || "#2563eb");

      // Création de l'élément HTML (on garde ta logique CSS)
      const el = document.createElement('div');
      const iconClass = site.typeSite === "véhicule de télémédecine assitée" 
        ? "fa-truck-medical" 
        : "fa-briefcase-medical";

      el.innerHTML = site.type === "cabinet" 
        ? `<div class="cabinet-marker" style="--cm-color:${color}">
             <div class="cabinet-pulse"></div>
             <div class="cabinet-pin"><i class="fa-solid fa-hospital"></i></div>
           </div>`
        : `<div class="cabinet-marker" style="--cm-color:${color}">
             <div class="salle-pulse"></div>
             <div class="salle-pin" style="width:24px; height:24px;"><i class="fa-solid ${iconClass}"></i></div>
           </div>`;

      // Création du marqueur MapLibre
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.lng, site.lat])
        .addTo(this.map);

      el.addEventListener('click', () => openSitePanel(site, color));
      
      this.markers.push(marker);
      store.markers.push(marker);
    });

    if (typeof updateStats === "function") updateStats();
  }

  flyTo(lat, lng, zoom = 13) {
    // Attention: MapLibre utilise [lng, lat]
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      essential: true,
      duration: 1000
    });
  }

  applyFilters() {
    this.renderSites();
  }
}