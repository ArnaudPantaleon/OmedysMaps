import { store } from "../core/store.js"

let _map        = null
let _debounce   = null
let _inputEl    = null
let _suggestEl  = null

export function initSearch(map) {

  _map = map

  // Injecter dans le slot créé par ui.filters.js
  const tile = document.getElementById("search-slot")
  if (!tile) return

  // Icône loupe
  const searchIcon = document.createElement("i")
  searchIcon.className = "fa-solid fa-magnifying-glass"
  tile.appendChild(searchIcon)

  _inputEl = document.createElement("input")
  _inputEl.type = "text"
  _inputEl.placeholder = "Rechercher une ville, un CP…"
  _inputEl.autocomplete = "off"

  const clearBtn = document.createElement("button")
  clearBtn.className = "inner-search-btn"
  clearBtn.innerHTML = `<i class="fa-solid fa-xmark"></i>`
  clearBtn.style.display = "none"
  clearBtn.addEventListener("click", _clear)

  tile.appendChild(_inputEl)
  tile.appendChild(clearBtn)

  // Conteneur suggestions
  _suggestEl = document.createElement("div")
  _suggestEl.id = "suggestions"
  document.body.appendChild(_suggestEl)

  // Événements
  _inputEl.addEventListener("input", () => {
    const q = _inputEl.value.trim()
    clearBtn.style.display = q ? "flex" : "none"
    clearTimeout(_debounce)
    if (q.length < 2) { _clearSuggestions(); return }
    _debounce = setTimeout(() => _search(q), 250)
  })

  _inputEl.addEventListener("keydown", e => {
    if (e.key === "Escape") _clear()
  })

  document.addEventListener("click", e => {
    if (!tile.contains(e.target) && !_suggestEl.contains(e.target))
      _clearSuggestions()
  })

}

// ─── Recherche ────────────────────────────────────────────────────────────────

async function _search(q) {

  const results = []

  // 1. Recherche dans les sites locaux
  const qLow = q.toLowerCase()
  const local = store.sites
    .filter(s =>
      s.city?.toLowerCase().includes(qLow) ||
      s.name?.toLowerCase().includes(qLow) ||
      s.dept?.startsWith(q)
    )
    .slice(0, 5)
    .map(s => ({
      label:    s.name,
      sub:      s.city || s.address,
      zip:      s.dept,
      lat:      s.lat,
      lng:      s.lng,
      local:    true
    }))

  results.push(...local)

  // 2. API geo.api.gouv.fr
  try {
    const isCP = /^\d{2,5}$/.test(q)
    const url  = isCP
      ? `https://geo.api.gouv.fr/communes?codePostal=${q}&fields=nom,codesPostaux,centre,codeDepartement&limit=8`
      : `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,codesPostaux,centre,codeDepartement&limit=8&boost=population`

    const res  = await fetch(url)
    const data = await res.json()

    data.forEach(c => {
      results.push({
        label:  c.nom,
        sub:    c.codeDepartement,
        zip:    c.codesPostaux?.[0] || "",
        lat:    c.centre?.coordinates?.[1],
        lng:    c.centre?.coordinates?.[0],
        local:  false
      })
    })
  } catch {
    // silencieux si pas de réseau
  }

  _renderSuggestions(results, q)

}

// ─── Rendu suggestions ────────────────────────────────────────────────────────

function _renderSuggestions(results, q) {

  _suggestEl.innerHTML = ""

  if (results.length === 0) {
    const empty = document.createElement("div")
    empty.className = "suggestion-item empty"
    empty.textContent = "Aucun résultat"
    _suggestEl.appendChild(empty)
    return
  }

  // Dédoublonner par label+zip
  const seen = new Set()
  results
    .filter(r => {
      const key = `${r.label}|${r.zip}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
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

}

// ─── Sélection ────────────────────────────────────────────────────────────────

function _select(r) {
  if (r.lat && r.lng) {
    _map.flyTo(r.lat, r.lng, r.local ? 14 : 12)
  }
  _inputEl.value = r.label
  _clearSuggestions()
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function _clear() {
  _inputEl.value = ""
  _clearSuggestions()
  document.querySelector(".inner-search-btn").style.display = "none"
}

function _clearSuggestions() {
  if (_suggestEl) _suggestEl.innerHTML = ""
}

function _highlight(text, q) {
  if (!q) return text
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text.replace(re, `<strong style="color:var(--primary)">$1</strong>`)
}
