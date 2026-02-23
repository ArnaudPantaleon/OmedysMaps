import { CONFIG }      from "../core/config.js"
import { store }       from "../core/store.js"
import { BP3Popup }    from "../ui/popup.bp3.js"
import { updateStats } from "../ui/ui.stats.js"

export class MapEngine {

  constructor() {

    this.map = L.map("map", { zoomControl: false })
      .setView(CONFIG.map.center, CONFIG.map.zoom)

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap" }
    ).addTo(this.map)

    // Salles : clusterisées normalement
    this.cluster = L.markerClusterGroup()
    this.map.addLayer(this.cluster)

    // Cabinets : layer plat, jamais clusterisé, toujours au-dessus
    this.cabinetLayer = L.layerGroup()
    this.map.addLayer(this.cabinetLayer)

  }

  // Vérifie si un site passe tous les filtres actifs
  _isVisible(site) {

    const f = store.filters

    // --- Filtre dataset (cabinet / salle) ---
    if (site.type === "cabinet" && !f.dataset.cabinet) return false
    if (site.type === "salle"   && !f.dataset.salle)   return false

    // --- Filtre statut ---
    if (site.type === "cabinet") {
      if (f.statusCabinet[site.status] === false) return false
    }
    if (site.type === "salle") {
      if (f.statusSalle[site.status] === false) return false
    }

    // --- Filtre type de site (salles uniquement) ---
    if (site.type === "salle" && site.typeSite) {
      if (f.typeSite[site.typeSite] === false) return false
    }

    // --- Filtre TMS (salles uniquement) ---
    if (site.type === "salle" && site.tms) {
      if (f.tms[site.tms] === false) return false
    }

    // --- Filtre département ---
    if (f.departement && site.dept !== f.departement) return false

    // --- Filtre région (via liste de depts de la région) ---
    if (f.region) {
      const depts = store.deptsByRegion?.[f.region] || []
      if (!depts.includes(site.dept)) return false
    }

    return true

  }

  renderSites() {

    this.cluster.clearLayers()
    this.cabinetLayer.clearLayers()
    store.markers.length = 0

    store.sites.forEach(site => {

      if (!this._isVisible(site)) return

      const color = site.type === "cabinet"
        ? (CONFIG.statusCabinet[site.status]?.color || "#94a3b8")
        : (CONFIG.statusSalle[site.status]?.color   || "#2563eb")

      let marker

      if (site.type === "cabinet") {

        // ── Cabinet : divIcon FA + halo pulsé, jamais clusterisé ──
        const icon = L.divIcon({
          className: "",
          html: `
            <div class="cabinet-marker" style="--cm-color:${color}">
              <div class="cabinet-pulse"></div>
              <div class="cabinet-pin">
                <i class="fa-solid fa-briefcase-medical"></i>
              </div>
            </div>`,
          iconSize:    [36, 36],
          iconAnchor:  [18, 18],
          popupAnchor: [0, -20]
        })

        marker = L.marker([site.lat, site.lng], { icon, zIndexOffset: 1000 })

        marker.site = site
        marker.bindPopup(BP3Popup(site, color), { maxWidth: 400, className: "bp3-popup" })
        this.cabinetLayer.addLayer(marker)

      } else {

        // ── Salle : circleMarker clusterisé ──
        marker = L.circleMarker(
          [site.lat, site.lng],
          { radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: .9 }
        )

        marker.site = site
        marker.bindPopup(BP3Popup(site, color), { maxWidth: 400, className: "bp3-popup" })
        this.cluster.addLayer(marker)

      }

      store.markers.push(marker)

    })

    updateStats()

  }

  applyFilters() {
    this.renderSites()
  }

  // Recentre la carte sur des coordonnées
  flyTo(lat, lng, zoom = 13) {
    this.map.flyTo([lat, lng], zoom, { duration: 1 })
  }

}
