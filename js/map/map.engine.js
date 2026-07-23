import { CONFIG }      from "../core/config.js"
import { store }       from "../core/store.js"
import { updateStats } from "../ui/ui.stats.js"
import { openSitePanel } from "../ui/ui.panel.js"

import { getTheme }    from "../core/theme.js"
import * as maplibregl from 'https://unpkg.com/maplibre-gl@^6.0.0/dist/maplibre-gl.mjs';

export class MapEngine {

  constructor() {
    const mediaQuery = window.matchMedia("(max-width: 768px)")
    const isMobile = mediaQuery.matches

    const initialZoom = isMobile
      ? CONFIG.map.mobileZoom
      : CONFIG.map.zoom

    // 1. Déterminer le thème initial
    let initialTheme = getTheme()
    if (initialTheme === "system") {
      initialTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    // 2. Initialisation de MapLibre (Vectoriel)
    // Note : CONFIG.map.center doit être [lng, lat]
    this.map = new maplibregl.Map({
      container: 'map',
      style: initialTheme === "dark" ? CONFIG.map.themedark : CONFIG.map.themelight,
      center: CONFIG.map.center,
      zoom: initialZoom,
      antialias: true
    })

    // 3. Gestion des marqueurs (Remplace les couches Leaflet)
    this.markers = []

    // 4. Événements
    this.map.on('load', () => {
      this.renderSites()
    })

    // Adapter le zoom si on change de breakpoint
    mediaQuery.addEventListener("change", e => {
      this.map.setZoom(e.matches ? CONFIG.map.mobileZoom : CONFIG.map.zoom)
    })

    // Écoute flyto-site (clic UI)
    window.addEventListener("flyto-site", e => {
      const { lat, lng, zoom } = e.detail || {}
      if (lat && lng) this.flyTo(lat, lng, zoom || 15)
    })
  }

  /**
   * Met à jour le style de la carte (Light/Dark)
   */
  updateTheme(theme) {
    let target = theme
    if (theme === 'system') {
      target = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    const newStyleUrl = target === 'dark' ? CONFIG.map.themedark : CONFIG.map.themelight
    this.map.setStyle(newStyleUrl)
    
    // Après le changement de style, MapLibre peut vider le canvas, 
    // on s'assure que les marqueurs restent visibles
    this.map.once('style.load', () => this.renderSites())
  }

  /**
   * Rendu des marqueurs sur la carte
   */
  renderSites = () => {
    // Nettoyage des anciens marqueurs
    this.markers.forEach(m => m.remove())
    this.markers = []

    store.markers.length = 0

    store.sites.forEach(site => {
      // Correction de l'erreur : _isVisible est appelée via l'instance
      if (!this._isVisible(site)) return

      const color = site.type === "cabinet"
        ? (CONFIG.statusCabinet?.[site.status]?.color || "#94a3b8")
        : (CONFIG.statusSalle?.[site.status]?.color   || "#2563eb")

      const el = document.createElement('div')
      const iconClass = site.typeSite === "véhicule de télémédecine assitée" 
        ? "fa-truck-medical" 
        : "fa-briefcase-medical"

      // On injecte ton HTML/CSS d'origine
      el.innerHTML = site.type === "cabinet"
        ? `<div class="cabinet-marker" style="--cm-color:${color}">
             <div class="cabinet-pulse"></div>
             <div class="cabinet-pin"><i class="fa-solid fa-hospital"></i></div>
           </div>`
        : `<div class="cabinet-marker" style="--cm-color:${color}">
             <div class="salle-pulse"></div>
             <div class="salle-pin"><i class="fa-solid ${iconClass}"></i></div>
           </div>`

      // Création du marqueur MapLibre
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.lng, site.lat])
        .addTo(this.map)

      el.addEventListener("click", () => openSitePanel(site, color))
      
      // Stockage pour accès ultérieur (stats/filtres)
      marker.site = site 
      this.markers.push(marker)

      store.markers.push(marker)
    })

    if (typeof updateStats === "function") updateStats()
  }

  /**
   * Logique de filtrage
   */
  _isVisible(site) {
    const f = store.filters
    if (!f) return true

    if (site.type === "cabinet") {
      if (!f.dataset.cabinet) return false
      if (f.statusCabinet[site.status] === false) return false
    }
    if (site.type === "salle") {
      if (!f.dataset.salle) return false
      if (f.statusSalle[site.status] === false) return false
      if (site.typeSite && f.typeSite[site.typeSite] === false) return false
      if (site.tms && f.tms[site.tms] === false) return false
    }
    if (f.departement && site.dept !== f.departement) return false
    if (f.region) {
      const depts = store.deptsByRegion?.[f.region] || []
      if (!depts.includes(site.dept)) return false
    }
    return true
  }

  /**
   * Navigation fluide
   */
  flyTo(lat, lng, zoom = 13) {
    this.map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      essential: true,
      duration: 1000
    })
  }

  applyFilters() {
    this.renderSites()
  }
}
