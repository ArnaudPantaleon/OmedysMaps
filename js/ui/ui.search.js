import { store } from "../core/store.js"

let _map        = null
let _debounce   = null
let _inputEl    = null
let _suggestEl  = null
let _tileEl     = null

export function initSearch(map) {

  _map = map

  _tileEl = document.getElementById("search-slot")
  if (!_tileEl) return

  const searchIcon = document.createElement("i")
  searchIcon.className = "fa-solid fa-magnifying-glass"
  _tileEl.appendChild(searchIcon)

  _inputEl = document.createElement("input")
  _inputEl.type = "text"
  _inputEl.placeholder = "Rechercher une ville, un CP…"
  _inputEl.autocomplete = "off"
  _tileEl.appendChild(_inputEl)

  const clearBtn = document.createElement("button")
  clearBtn.className = "inner-search-btn"
  clearBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`
  clearBtn.style.display = "none"
  clearBtn.addEventListener("click", _clear)
  _tileEl.appendChild(clearBtn)

  // Suggestions — au body, positionnées dynamiquement sous le slot
  _suggestEl = document.createElement("div")
  _suggestEl.id = "suggestions"
  _suggestEl.style.display = "none"
  document.body.appendChild(_suggestEl)

  _inputEl.addEventListener("input", () => {
    const q = _inputEl.value.trim()
    clearBtn.style.display = q ? "flex" : "none"
    clearTimeout(_debounce)
    if (q.length < 2) { _hideSug(); return }
    _debounce = setTimeout(() => _search(q), 250)
  })

  _inputEl.addEventListener("keydown", e => {
    if (e.key === "Escape") _clear()
  })

  document.addEventListener("click", e => {
    if (!_tileEl.contains(e.target) && !_suggestEl.contains(e.target))
      _hideSug()
  })

  window.addEventListener("resize", _reposition)

}

// ── Positionnement dynamique ──────────────────────────────────
function _reposition() {
  if (!_tileEl || !_suggestEl) return
  const rect = _tileEl.getBoundingClientRect()
  _suggestEl.style.position = "fixed"
  _suggestEl.style.top      = (rect.bottom + 6) + "px"
  _suggestEl.style.left     = rect.left + "px"
  _suggestEl.style.width    = rect.width + "px"
  _suggestEl.style.right    = "auto"
}

// ── Recherche ─────────────────────────────────────────────────
async function _search(q) {

  const results = []
  const qLow = q.toLowerCase()

  // Sites locaux
  store.sites
    .filter(s =>
      s.city?.toLowerCase().includes(qLow) ||
      s.name?.toLowerCase().includes(qLow) ||
      s.dept?.startsWith(q)
    )
    .slice(0, 5)
    .forEach(s => results.push({
      label: s.name,
      sub:   s.city || s.address,
      zip:   s.dept,
      lat:   s.lat,
      lng:   s.lng,
      local: true
    }))

  // API géo
  try {
    const isCP = /^\d{2,5}$/.test(q)
    const url  = isCP
      ? `https://geo.api.gouv.fr/communes?codePostal=${q}&fields=nom,codesPostaux,centre,codeDepartement&limit=8`
      : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,codesPostaux,centre,codeDepartement&limit=8&boost=population`
    const data = await fetch(url).then(r => r.json())
    data.forEach(c => results.push({
      label: c.nom,
      sub:   c.codeDepartement,
      zip:   c.codesPostaux?.[0] || "",
      lat:   c.centre?.coordinates?.[1],
      lng:   c.centre?.coordinates?.[0],
      local: false
    }))
  } catch {}

  _renderSuggestions(results, q)
}

// ── Rendu suggestions ─────────────────────────────────────────
function _renderSuggestions(results, q) {

  _suggestEl.innerHTML = ""
  _reposition()

  if (results.length === 0) {
    const empty = document.createElement("div")
    empty.className = "suggestion-item empty"
    empty.textContent = "Aucun résultat"
    _suggestEl.appendChild(empty)
    _suggestEl.style.display = "block"
    return
  }

  const seen = new Set()
  results
    .filter(r => {
      const key = `${r.label}|${r.zip}`
      if (seen.has(key)) return false
      seen.add(key); return true
    })
    .slice(0, 10)
    .forEach(r => {
      const item = document.createElement("div")
      item.className = "suggestion-item"
      item.innerHTML = `
        <div class="suggestion-header">
          <span class="suggestion-city">${_highlight(r.label, q)}</span>
          ${r.zip ? `<span class="suggestion-zip">${r.zip}</span>` : ""}
        </div>
        <div class="suggestion-meta">
          <span class="suggestion-province">${r.local ? "📍 Site Omedys" : r.sub || ""}</span>
        </div>
      `
      item.addEventListener("click", () => _select(r))
      _suggestEl.appendChild(item)
    })

  _suggestEl.style.display = "block"
}

// ── Sélection ─────────────────────────────────────────────────
function _select(r) {
  if (r.lat && r.lng) _map.flyTo(r.lat, r.lng, r.local ? 14 : 12)
  _inputEl.value = r.label
  _hideSug()

  // Stocker le centre dans le store
  store.filters.radiusCenter = (r.lat && r.lng)
    ? { lat: r.lat, lng: r.lng, name: r.label }
    : null

  // Émettre l'event — ui.filters.js l'écoute pour activer le sélecteur périmètre
  window.dispatchEvent(new CustomEvent("city-selected", {
    detail: { lat: r.lat, lng: r.lng, name: r.label }
  }))
}

// ── Utils ─────────────────────────────────────────────────────
function _clear() {
  _inputEl.value = ""
  _hideSug()
  document.querySelector(".inner-search-btn").style.display = "none"

  // Réinitialiser le filtre périmètre
  store.filters.radiusCenter = null
  store.filters.radius       = null

  window.dispatchEvent(new CustomEvent("city-selected", { detail: null }))
}

function _hideSug() {
  if (_suggestEl) {
    _suggestEl.innerHTML    = ""
    _suggestEl.style.display = "none"
  }
}

function _highlight(text, q) {
  if (!q) return text
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text.replace(re, `<strong style="color:var(--primary)">$1</strong>`)
}
