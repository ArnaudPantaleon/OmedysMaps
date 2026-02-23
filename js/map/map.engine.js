import { CONFIG }    from "../core/config.js"
import { store }     from "../core/store.js"
import { BP3Popup }  from "../ui/popup.bp3.js"
import { updateStats } from "../ui/ui.stats.js"

export class MapEngine {

  constructor() {

    this.map = L.map("map", { zoomControl: false })
      .setView(CONFIG.map.center, CONFIG.map.zoom)

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap" }
    ).addTo(this.map)

    this.cluster = L.markerClusterGroup()
    this.map.addLayer(this.cluster)

  }

  renderSites() {

    this.cluster.clearLayers()
    store.markers.length = 0

    store.sites.forEach(site => {

      // Appliquer le filtre de statut
      const statusFilter = store.filters.status[site.status]
      if (statusFilter === false) return

      const color =
        CONFIG.status[site.status]?.color ||
        (site.type === "salle" ? "#2563eb" : "#94a3b8")

      const marker = L.circleMarker(
        [site.lat, site.lng],
        {
          radius:      7,
          fillColor:   color,
          color:       "#fff",
          weight:      2,
          fillOpacity: .9
        }
      )

      marker.site = site

      marker.bindPopup(
        BP3Popup(site, color),
        { maxWidth: 340, className: "bp3-popup" }
      )

      this.cluster.addLayer(marker)
      store.markers.push(marker)

    })

    updateStats()

  }

  // Appelé par les filtres
  applyFilters() {
    this.renderSites()
  }

}
