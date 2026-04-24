import { store }  from "../core/store.js"
import { CONFIG } from "../core/config.js"

// ─── Haversine ────────────────────────────────────────────────────────────────
function _haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(lat1 * Math.PI / 180)
          * Math.cos(lat2 * Math.PI / 180)
          * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ─── Salles proches ───────────────────────────────────────────────────────────
function _getNearestSalles(center, limit = 8) {
  return store.sites
    .filter(s => s.type === "salle" && s.lat && s.lng)
    .map(s => ({ ...s, distance: _haversine(center.lat, center.lng, s.lat, s.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
}

// ─── Compteur sites visibles ──────────────────────────────────────────────────
function _countVisible() {
  return store.sites.filter(site => {
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
    if (f.radius && f.radiusCenter && site.lat && site.lng) {
      if (_haversine(f.radiusCenter.lat, f.radiusCenter.lng, site.lat, site.lng) > f.radius) return false
    }
    return true
  }).length
}

// ─── Rendu ────────────────────────────────────────────────────────────────────
function _renderCount(el) {
  el.innerHTML = `<small>SITES AFFICHÉS</small><span id="site-count">${_countVisible()}</span>`
  el.classList.remove("stats-nearest-mode")
}

function _renderNearest(el, center) {
  const nearest = _getNearestSalles(center)

  const statusColor = s =>
    CONFIG.statusSalle?.[s.status]?.color ||
    CONFIG.status?.[s.status]?.color ||
    "#94a3b8"

  el.classList.add("stats-nearest-mode")
  el.innerHTML = `
    <div class="nearest-header">
      <i class="fa-solid fa-location-dot"></i>
      <span>Salles proches de <strong>${center.name}</strong></span>
    </div>
    <div class="nearest-list">
      ${nearest.map((s, i) => `
        <div class="nearest-item" data-lat="${s.lat}" data-lng="${s.lng}">
          <span class="nearest-rank">${i + 1}</span>
          <div class="nearest-info">
            <span class="nearest-name">${s.name || "Salle"}</span>
            <span class="nearest-city">${s.city || s.address || ""}</span>
          </div>
          <div class="nearest-right">
            <span class="nearest-dist">${s.distance < 1 ? (s.distance * 1000).toFixed(0) + " m" : s.distance.toFixed(1) + " km"}</span>
            <span class="nearest-dot" style="background:${statusColor(s)}"></span>
          </div>
        </div>
      `).join("")}
    </div>
  `

  // Clic sur une salle → flyTo via event
  el.querySelectorAll(".nearest-item").forEach(item => {
    item.addEventListener("click", () => {
      const lat = parseFloat(item.dataset.lat)
      const lng = parseFloat(item.dataset.lng)
      if (lat && lng) {
        window.dispatchEvent(new CustomEvent("flyto-site", { detail: { lat, lng, zoom: 15 } }))
      }
    })
  })
}

// ─── API publique ─────────────────────────────────────────────────────────────
export function initStats() {
  // Attendre que le DOM bento soit injecté par ui.filters.js
  requestAnimationFrame(() => {
    updateStats()

    // Bascule en mode "salles proches" ou compteur selon la ville sélectionnée
    window.addEventListener("city-selected", e => {
      const el = document.getElementById("stats-tile")
      if (!el) return
      e.detail ? _renderNearest(el, e.detail) : _renderCount(el)
    })
  })
}

export function updateStats() {
  const tile = document.getElementById("stats-tile")
  if (!tile) return

  // Si on est déjà en mode nearest ET qu'un centre est défini → rafraîchir nearest
  if (store.filters.radiusCenter) {
    _renderNearest(tile, store.filters.radiusCenter)
    return
  }

  // Mode compteur standard
  _renderCount(tile)
}