import { CONFIG } from "../core/config.js"
import { store }  from "../core/store.js"
import { setTheme, getTheme } from "../core/theme.js"

const THEME_LABELS = {
  light:  { icon: "fa-sun",               label: "Clair"  },
  dark:   { icon: "fa-moon",              label: "Sombre" },
  system: { icon: "fa-circle-half-stroke", label: "Auto"   }
}

// ─── Haversine ────────────────────────────────────────────────────────────────
// Retourne la distance en km entre deux points GPS

function _haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2
          + Math.cos(lat1 * Math.PI / 180)
          * Math.cos(lat2 * Math.PI / 180)
          * Math.sin(dLng/2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countVisible() {
  return store.sites.filter(s => {
    const f = store.filters
    if (s.type === "cabinet") {
      if (!f.dataset.cabinet) return false
      if (f.statusCabinet[s.status] === false) return false
    }
    if (s.type === "salle") {
      if (!f.dataset.salle) return false
      if (f.statusSalle[s.status] === false) return false
      if (s.typeSite && f.typeSite[s.typeSite] === false) return false
      if (s.tms && f.tms[s.tms] === false) return false
    }
    if (f.departement && s.dept !== f.departement) return false
    if (f.region) {
      const depts = store.deptsByRegion?.[f.region] || []
      if (!depts.includes(s.dept)) return false
    }
    // Filtre périmètre
    if (f.radius && f.radiusCenter && s.lat && s.lng) {
      const d = _haversine(f.radiusCenter.lat, f.radiusCenter.lng, s.lat, s.lng)
      if (d > f.radius) return false
    }
    return true
  }).length
}

function countBy(key, val, type = null) {
  return store.sites.filter(s =>
    (type ? s.type === type : true) && s[key] === val
  ).length
}

// ─── Builders ────────────────────────────────────────────────────────────────

function makeColorFilter(label, color, count, active, onToggle) {
  const el = document.createElement("div")
  el.className = "filter-item color-filter" + (active ? " active" : "")
  el.innerHTML = `
    <div class="filter-dot" style="background:${color}"></div>
    <div class="filter-content">
      <span class="filter-label">${label}</span>
      <span class="filter-description">${count} site(s)</span>
    </div>
    <div class="filter-checkbox"></div>
  `
  el.addEventListener("click", () => {
    const next = onToggle()
    el.classList.toggle("active", next)
  })
  return el
}

function makeToggleFilter(label, desc, active, onToggle) {
  const el = document.createElement("div")
  el.className = "filter-item toggle-filter" + (active ? " active" : "")
  el.innerHTML = `
    <div class="filter-content">
      <span class="filter-label">${label}</span>
      <span class="filter-description">${desc}</span>
    </div>
    <div class="toggle-switch"></div>
  `
  el.addEventListener("click", () => {
    const next = onToggle()
    el.classList.toggle("active", next)
  })
  return el
}

function makeSection(title, badgeCount) {
  const s = document.createElement("div")
  s.className = "filter-section"
  s.innerHTML = `
    <div class="section-title">
      ${title}
      <span class="section-badge">${badgeCount}</span>
    </div>
  `
  const grid = document.createElement("div")
  grid.className = "filters-grid"
  s.appendChild(grid)
  return { section: s, grid }
}

function makeDivider() {
  const d = document.createElement("div")
  d.className = "filters-divider"
  return d
}

function makeSelect(placeholder, options, value, onChange) {
  const wrap = document.createElement("div")
  wrap.style.cssText = "padding:4px 0"
  const sel = document.createElement("select")
  sel.innerHTML = `<option value="">${placeholder}</option>`
  options.forEach(({ value: v, label }) => {
    const o = document.createElement("option")
    o.value = v
    o.textContent = label
    if (v === value) o.selected = true
    sel.appendChild(o)
  })
  sel.addEventListener("change", () => onChange(sel.value || null))
  wrap.appendChild(sel)
  return { wrap, sel }
}

// ─── Theme switcher (intégré dans le panneau filtres) ─────────────────────────

function makeThemeSection() {
  const section = document.createElement("div")
  section.className = "filter-section theme-section"

  section.innerHTML = `
    <div class="section-title">
      <i class="fa-solid fa-palette" style="font-size:11px;color:var(--primary);opacity:.8"></i>
      Apparence
    </div>
  `

  const btns = document.createElement("div")
  btns.className = "theme-switcher-btns"

  const current = getTheme()

  Object.entries(THEME_LABELS).forEach(([key, { icon, label }]) => {
    const btn = document.createElement("button")
    btn.className = "theme-btn" + (key === current ? " active" : "")
    btn.dataset.theme = key
    btn.innerHTML = `
      <i class="fa-solid ${icon} theme-btn-icon"></i>
      <span class="theme-btn-label">${label}</span>
    `
    btn.addEventListener("click", () => {
      setTheme(key)
      btns.querySelectorAll(".theme-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.theme === key)
      )
    })
    btns.appendChild(btn)
  })

  section.appendChild(btns)
  return section
}

// ─── Périmètre de recherche ───────────────────────────────────────────────────

const RADIUS_OPTIONS = [5, 10, 20, 30, 50]

function makeRadiusSection(refreshFn) {
  const section = document.createElement("div")
  section.className = "filter-section radius-section"
  section.id = "radius-section"

  // Label + ville sélectionnée
  const titleRow = document.createElement("div")
  titleRow.className = "section-title"
  titleRow.innerHTML = `
    <i class="fa-solid fa-circle-dot" style="font-size:11px;color:var(--primary);opacity:.8"></i>
    Périmètre
    <span class="radius-city-label" id="radius-city-label"></span>
  `
  section.appendChild(titleRow)

  // Boutons km
  const btns = document.createElement("div")
  btns.className = "radius-btns"
  btns.id = "radius-btns"

  RADIUS_OPTIONS.forEach(km => {
    const btn = document.createElement("button")
    btn.className = "radius-btn"
    btn.dataset.km = km
    btn.textContent = `${km} km`
    btn.addEventListener("click", () => {
      const alreadyActive = btn.classList.contains("active")

      // Toggle : cliquer sur le bouton actif = désactiver
      btns.querySelectorAll(".radius-btn").forEach(b => b.classList.remove("active"))

      if (alreadyActive) {
        store.filters.radius = null
      } else {
        btn.classList.add("active")
        store.filters.radius = km
      }

      refreshFn()
    })
    btns.appendChild(btn)
  })

  section.appendChild(btns)

  // Désactivé par défaut — s'active à city-selected
  section.classList.add("radius-disabled")

  // Écoute la sélection d'une ville depuis ui.search.js
  window.addEventListener("city-selected", e => {
    const detail = e.detail

    if (!detail) {
      // Recherche effacée → réinitialiser
      section.classList.add("radius-disabled")
      btns.querySelectorAll(".radius-btn").forEach(b => b.classList.remove("active"))
      store.filters.radius       = null
      store.filters.radiusCenter = null
      document.getElementById("radius-city-label").textContent = ""
      refreshFn()
      return
    }

    // Ville sélectionnée → activer
    section.classList.remove("radius-disabled")
    document.getElementById("radius-city-label").textContent = detail.name

    // Optionnel : réactiver le dernier rayon sélectionné
    if (store.filters.radius) {
      btns.querySelectorAll(".radius-btn").forEach(b => {
        b.classList.toggle("active", Number(b.dataset.km) === store.filters.radius)
      })
      refreshFn()
    }
  })

  return section
}

// ─── Init principal ───────────────────────────────────────────────────────────

export function initFilters(map, zones) {

  // Initialiser les états depuis CONFIG
  Object.entries(CONFIG.statusCabinet).forEach(([k, v]) => store.filters.statusCabinet[k] = v.checked)
  Object.entries(CONFIG.statusSalle).forEach(([k, v])   => store.filters.statusSalle[k]   = v.checked)
  Object.entries(CONFIG.typeSite).forEach(([k, v])      => store.filters.typeSite[k]       = v.checked)

  // TMS dynamique depuis les données
  const allTMS = [...new Set(store.sites.filter(s => s.type === "salle").map(s => s.tms).filter(Boolean))].sort()
  allTMS.forEach(t => store.filters.tms[t] = true)

  // Construire la map dept → région depuis zones.json
  _buildDeptsByRegion(zones)

  // ── DOM bento ──
  const wrapper = document.createElement("div")
  wrapper.className = "bento-wrapper"

  // Ligne 1 : hamburger + search
  const row = document.createElement("div")
  row.className = "bento-row"

  const menuBtn = document.createElement("button")
  menuBtn.className = "bento-tile bento-action"
  menuBtn.id = "menu-btn"
  menuBtn.innerHTML = `<span class="bar"></span><span class="bar"></span><span class="bar"></span>`

  const searchSlot = document.createElement("div")
  searchSlot.id = "search-slot"
  searchSlot.className = "bento-tile bento-search"
  searchSlot.style.flex = "1"

  row.appendChild(menuBtn)
  row.appendChild(searchSlot)
  wrapper.appendChild(row)

  // Ligne 2 : stats
  const statsTile = document.createElement("div")
  statsTile.className = "bento-tile bento-stats"
  statsTile.innerHTML = `<small>SITES AFFICHÉS</small><span id="site-count">0</span>`
  wrapper.appendChild(statsTile)

  // Panneau filtres
  const panel = document.createElement("div")
  panel.className = "bento-tile bento-filters"

  const listWrap = document.createElement("div")
  listWrap.id = "filter-list"
  listWrap.className = "filter-list-wrapper"

  function refresh() {
    map.applyFilters()
    const el = document.getElementById("site-count")
    if (el) el.textContent = countVisible()
  }

  // ── Apparence (en tête de panneau) ──
  listWrap.appendChild(makeThemeSection())
  listWrap.appendChild(makeDivider())

  // ── Périmètre de recherche ──
  listWrap.appendChild(makeRadiusSection(refresh))
  listWrap.appendChild(makeDivider())

  // ── Section 1 : Dataset ──
  const ds = makeSection("Type de dataset", 2)
  ds.grid.appendChild(makeToggleFilter(
    "Cabinets TMS",
    `${store.sites.filter(s => s.type === "cabinet").length} cabinet(s)`,
    store.filters.dataset.cabinet,
    () => { store.filters.dataset.cabinet = !store.filters.dataset.cabinet; refresh(); return store.filters.dataset.cabinet }
  ))
  ds.grid.appendChild(makeToggleFilter(
    "Salles de télémédecine",
    `${store.sites.filter(s => s.type === "salle").length} salle(s)`,
    store.filters.dataset.salle,
    () => { store.filters.dataset.salle = !store.filters.dataset.salle; refresh(); return store.filters.dataset.salle }
  ))
  listWrap.appendChild(ds.section)
  listWrap.appendChild(makeDivider())

  // ── Section 2 : Statut cabinets ──
  const sc = makeSection("Statut — Cabinets", Object.keys(CONFIG.statusCabinet).length)
  Object.entries(CONFIG.statusCabinet).forEach(([key, val]) => {
    sc.grid.appendChild(makeColorFilter(
      key, val.color,
      countBy("status", key, "cabinet"),
      store.filters.statusCabinet[key],
      () => { store.filters.statusCabinet[key] = !store.filters.statusCabinet[key]; refresh(); return store.filters.statusCabinet[key] }
    ))
  })
  listWrap.appendChild(sc.section)
  listWrap.appendChild(makeDivider())

  // ── Section 3 : Statut salles ──
  const ss = makeSection("Statut — Salles", Object.keys(CONFIG.statusSalle).length)
  Object.entries(CONFIG.statusSalle).forEach(([key, val]) => {
    ss.grid.appendChild(makeColorFilter(
      key, val.color,
      countBy("status", key, "salle"),
      store.filters.statusSalle[key],
      () => { store.filters.statusSalle[key] = !store.filters.statusSalle[key]; refresh(); return store.filters.statusSalle[key] }
    ))
  })
  listWrap.appendChild(ss.section)
  listWrap.appendChild(makeDivider())

  // ── Section 4 : Type de site ──
  const ts = makeSection("Type de site", Object.keys(CONFIG.typeSite).length)
  Object.entries(CONFIG.typeSite).forEach(([key, val]) => {
    const c = countBy("typeSite", key, "salle")
    if (c === 0) return
    ts.grid.appendChild(makeColorFilter(
      key, "#2563eb", c,
      val.checked,
      () => { store.filters.typeSite[key] = !store.filters.typeSite[key]; refresh(); return store.filters.typeSite[key] }
    ))
  })
  listWrap.appendChild(ts.section)
  listWrap.appendChild(makeDivider())

  // ── Section 5 : Cabinet TMS rattaché ──
  const tm = makeSection("Cabinet TMS rattaché", allTMS.length)
  allTMS.forEach(tms => {
    const c = countBy("tms", tms, "salle")
    tm.grid.appendChild(makeColorFilter(
      tms, "#8b5cf6", c,
      store.filters.tms[tms],
      () => { store.filters.tms[tms] = !store.filters.tms[tms]; refresh(); return store.filters.tms[tms] }
    ))
  })
  listWrap.appendChild(tm.section)
  listWrap.appendChild(makeDivider())

  // ── Section 6 : Région ──
  const rg = makeSection("Région", "")
  const regionOpts = (zones?.regions || []).map(r => ({ value: r.code, label: r.nom }))
  const { wrap: regionWrap, sel: regionSel } = makeSelect("Toutes les régions", regionOpts, null, val => {
    store.filters.region = val
    store.filters.departement = null
    if (deptSel) deptSel.value = ""
    refresh()
  })
  rg.grid.appendChild(regionWrap)
  listWrap.appendChild(rg.section)

  // ── Section 7 : Département ──
  const dp = makeSection("Département", "")
  const deptOpts = (zones?.departements || []).map(d => ({ value: d.code, label: `${d.code} — ${d.nom}` }))
  const { wrap: deptWrap, sel: deptSel } = makeSelect("Tous les départements", deptOpts, null, val => {
    store.filters.departement = val
    store.filters.region = null
    if (regionSel) regionSel.value = ""
    refresh()
  })
  dp.grid.appendChild(deptWrap)
  listWrap.appendChild(dp.section)

  // ── Séparateur + Reset ──
  listWrap.appendChild(makeDivider())

  const resetBtn = document.createElement("button")
  resetBtn.textContent = "↺ Réinitialiser les filtres"
  resetBtn.className = "filter-reset-btn"
  resetBtn.addEventListener("click", () => _resetFilters(map, wrapper))
  listWrap.appendChild(resetBtn)

  panel.appendChild(listWrap)
  wrapper.appendChild(panel)

  // Toggle hamburger
  menuBtn.addEventListener("click", () => {
    menuBtn.classList.toggle("active")
    panel.classList.toggle("open")
  })

  document.body.appendChild(wrapper)

  // Compteur initial
  const el = document.getElementById("site-count")
  if (el) el.textContent = countVisible()
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function _resetFilters(map, wrapper) {
  Object.entries(CONFIG.statusCabinet).forEach(([k, v]) => store.filters.statusCabinet[k] = v.checked)
  Object.entries(CONFIG.statusSalle).forEach(([k, v])   => store.filters.statusSalle[k]   = v.checked)
  Object.entries(CONFIG.typeSite).forEach(([k, v])      => store.filters.typeSite[k]       = v.checked)
  Object.keys(store.filters.tms).forEach(k              => store.filters.tms[k]            = true)

  store.filters.dataset.cabinet = true
  store.filters.dataset.salle   = true
  store.filters.region          = null
  store.filters.departement     = null

  wrapper.remove()
  initFilters(map, window._zonesCache)
  map.applyFilters()
}

// ─── Utilitaires géo ──────────────────────────────────────────────────────────

function _buildDeptsByRegion(zones) {
  if (!zones) return

  const REGION_DEPT = {
    "84": ["01","03","07","15","26","38","42","43","63","69","73","74"],
    "27": ["21","25","39","58","70","71","89","90"],
    "53": ["22","29","35","56"],
    "24": ["18","28","36","37","41","45"],
    "94": ["2A","2B"],
    "44": ["08","10","51","52","54","55","57","67","68","88"],
    "32": ["02","59","60","62","80"],
    "11": ["75","77","78","91","92","93","94","95"],
    "28": ["14","27","50","61","76"],
    "75": ["16","17","19","23","24","33","40","47","64","79","86","87"],
    "76": ["09","11","12","30","31","32","34","46","48","65","66","81","82"],
    "52": ["44","49","53","72","85"],
    "93": ["04","05","06","13","83","84"]
  }

  store.deptsByRegion = REGION_DEPT
}
