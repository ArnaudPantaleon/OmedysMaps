import { initTheme }  from "./core/theme.js"
import { loadData }   from "./data/data.loader.js"
import { store }      from "./core/store.js"
import { CONFIG }     from "./core/config.js"
import { BP3Popup }   from "./ui/popup.bp3.js"
import { initSearch } from "./ui/ui.search.js"

// ── Thème ─────────────────────────────────────────────────────
initTheme()

// ── Récupérer la config depuis la page hôte ───────────────────
// window.EMBED_CONFIG est défini dans index.embed.html
const EC = window.EMBED_CONFIG || {}

// ── Bootstrap DOM minimal ─────────────────────────────────────
function bootstrapUI() {
  const wrapper = document.createElement("div")
  wrapper.className = "bento-wrapper"

  const row = document.createElement("div")
  row.className = "bento-row"

  const searchSlot = document.createElement("div")
  searchSlot.id = "search-slot"
  searchSlot.className = "bento-tile bento-search"

  row.appendChild(searchSlot)
  wrapper.appendChild(row)
  document.body.appendChild(wrapper)
}

// ── Filtre embed ──────────────────────────────────────────────
// Retourne true si le site passe tous les critères de EC
function isVisible(site) {

  // Aucun filtre défini → rien n'est affiché
  const hasFilter =
    EC.dataset?.length ||
    EC.tms?.length     ||
    EC.typeSite?.length ||
    EC.statusCabinet?.length ||
    EC.statusSalle?.length

  if (!hasFilter) return false

  // Dataset : "cabinet" | "salle"
  if (EC.dataset?.length) {
    if (!EC.dataset.includes(site.type)) return false
  }

  // TMS rattaché (salles uniquement)
  if (EC.tms?.length && site.type === "salle") {
    if (!EC.tms.includes(site.tms)) return false
  }

  // Type de site (salles uniquement)
  if (EC.typeSite?.length && site.type === "salle") {
    if (!EC.typeSite.includes(site.typeSite)) return false
  }

  // Statut cabinets
  if (EC.statusCabinet?.length && site.type === "cabinet") {
    if (!EC.statusCabinet.includes(site.status)) return false
  }

  // Statut salles
  if (EC.statusSalle?.length && site.type === "salle") {
    if (!EC.statusSalle.includes(site.status)) return false
  }

  return true
}

// ── Carte ─────────────────────────────────────────────────────
function buildMap() {

  const map = L.map("map", { zoomControl: false })
    .setView(CONFIG.map.center, CONFIG.map.zoom)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map)

  const cluster      = L.markerClusterGroup()
  const cabinetLayer = L.layerGroup()
  map.addLayer(cluster)
  map.addLayer(cabinetLayer)

  // Rendu des sites filtrés
  store.sites.forEach(site => {
    if (!isVisible(site)) return

    const color = site.type === "cabinet"
      ? (CONFIG.statusCabinet[site.status]?.color || "#94a3b8")
      : (CONFIG.statusSalle[site.status]?.color   || "#2563eb")

    let marker

    if (site.type === "cabinet") {
      const icon = L.divIcon({
        className: "",
        html: `<div class="cabinet-marker" style="--cm-color:${color}">
          <div class="cabinet-pulse"></div>
          <div class="cabinet-pin"><i class="fa-solid fa-briefcase-medical"></i></div>
        </div>`,
        iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
      })
      marker = L.marker([site.lat, site.lng], { icon, zIndexOffset: 1000 })
      marker.bindPopup(BP3Popup(site, color), { maxWidth: 400, className: "bp3-popup" })
      cabinetLayer.addLayer(marker)
    } else {
      marker = L.circleMarker([site.lat, site.lng], {
        radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: .9
      })
      marker.bindPopup(BP3Popup(site, color), { maxWidth: 400, className: "bp3-popup" })
      cluster.addLayer(marker)
    }
  })

  // Exposer flyTo pour initSearch
  return {
    flyTo: (lat, lng, zoom = 13) => map.flyTo([lat, lng], zoom, { duration: 1 })
  }
}

// ── Démarrage ─────────────────────────────────────────────────
async function start() {
  bootstrapUI()
  await loadData()

  // Restreindre store.sites aux seuls sites visibles par la config embed
  // → la search ne propose que des sites effectivement affichés sur la carte
  store.sites = store.sites.filter(isVisible)

  const map = buildMap()
  initSearch(map)
}

start()
