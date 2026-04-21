import { CONFIG }      from "../core/config.js"
import { store }       from "../core/store.js"
import { updateStats } from "../ui/ui.stats.js"
import { openSitePanel } from "../ui/ui.panel.js"

export class MapEngine {

  constructor() {
    this.map = L.map("map", { zoomControl: false })
      .setView(CONFIG.map.center, CONFIG.map.zoom)

    L.tileLayer(CONFIG.map.theme, {
      attribution: "© OpenStreetMap"
    }).addTo(this.map)

    // Salles clusterisées
    this.cluster = L.markerClusterGroup({
        disableClusteringAtZoom: 18, // No clustering at zoom 5 and below
        maxClusterRadius: 80,       // Default radius in pixels
        zoomToBoundsOnClick: true   // Click cluster to zoom in
    });
    this.map.addLayer(this.cluster)

    // Cabinets jamais clusterisés
    this.cabinetLayer = L.layerGroup()
    this.map.addLayer(this.cabinetLayer)
  }

  renderSites() {
    this.cluster.clearLayers()
    this.cabinetLayer.clearLayers()
    store.markers.length = 0

    store.sites.forEach(site => {
      if (!this._isVisible(site)) return

      const color = site.type === "cabinet"
        ? (CONFIG.statusCabinet?.[site.status]?.color || CONFIG.status?.[site.status]?.color || "#94a3b8")
        : (CONFIG.statusSalle?.[site.status]?.color   || CONFIG.status?.[site.status]?.color || "#2563eb")

      let marker
      if (site.type === "cabinet") {
          const icon = L.divIcon({
            className: "",
            html: `<div class="cabinet-marker" style="--cm-color:${color}">
                    <div class="cabinet-pulse"></div>
                    <div class="cabinet-pin"><i class="fa-solid fa-hospital"></i></div>
                  </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          marker = L.marker([site.lat, site.lng], { icon, zIndexOffset: 1000 });
          this.cabinetLayer.addLayer(marker);
        } else {
          // 1. Determine the specific icon class first
          const iconClass = site.typeSite === "véhicule de télémédecine assitée" 
            ? "fa-truck-medical" 
            : "fa-briefcase-medical";
        
          // 2. Create the icon object
          const icon = L.divIcon({
            className: "",
            html: `<div class="cabinet-marker" style="--cm-color:${color}">
                    <div class="salle-pulse"></div>
                    <div class="salle-pin"><i class="fa-solid ${iconClass}"></i></div>
                  </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12] // Adjusted anchor to half of iconSize for centering
          });
        
          marker = L.marker([site.lat, site.lng], { icon, zIndexOffset: 1000 });
          this.cluster.addLayer(marker);
        }

      // Clic → panel directement, pas de popup Leaflet
      marker.on("click", () => openSitePanel(site, color))
      marker.site = site
      store.markers.push(marker)
    })

    updateStats()
  }

  _isVisible(site) {
    const f = store.filters
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

  flyTo(lat, lng, zoom = 13) {
    this.map.flyTo([lat, lng], zoom, { duration: 1 })
  }

  applyFilters() {
    this.renderSites()
  }

}
