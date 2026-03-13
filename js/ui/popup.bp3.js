// ── Chargement du cache details ───────────────────────────────
let _detailsCache = null

async function _loadDetails() {
  if (_detailsCache) return _detailsCache
  try {
    const res = await fetch("/data/details.json")
    const arr = await res.json()
    // Indexer par name pour lookup O(1)
    _detailsCache = {}
    arr.forEach(d => { _detailsCache[d.name] = d })
  } catch {
    _detailsCache = {}
  }
  return _detailsCache
}

// Pré-charger au démarrage
_loadDetails()

// ── Popup BP3 ─────────────────────────────────────────────────
export function BP3Popup(site, color) {
  return `
<div class="bp3">

  <div class="bp3-header">
    <div class="bp3-dot" style="background:${color}"></div>
    <div class="bp3-title">${site.name}</div>
  </div>

  <div class="bp3-body">
    ${site.address ? `<div class="bp3-row"><i class="fa-solid fa-location-dot bp3-icon"></i><span>${site.address}</span></div>` : ""}
    ${site.city    ? `<div class="bp3-row"><i class="fa-solid fa-city bp3-icon"></i><span>${site.city}</span></div>` : ""}
    ${site.phone   ? `<div class="bp3-row bp3-wide"><i class="fa-solid fa-phone bp3-icon"></i><a href="tel:${site.phone}">${_formatPhone(site.phone)}</a></div>` : ""}
    ${site.type === "salle" ? `
    <div class="bp3-footer">
      <button class="bp3-detail-btn" onclick="window._openSitePanel('${_esc(site.name)}')">
        <i class="fa-solid fa-circle-info"></i>
        <span>Informations</span>
      </button>
    </div>` : ""}
  </div>

</div>`
}

// ── Panel latéral ─────────────────────────────────────────────
export function initSitePanel() {

  // Overlay sombre
  const overlay = document.createElement("div")
  overlay.id = "panel-overlay"
  overlay.addEventListener("click", _closePanel)
  document.body.appendChild(overlay)

  // Panel
  const panel = document.createElement("div")
  panel.id = "site-panel"
  panel.innerHTML = `
    <div class="panel-header">
      <div class="panel-title-group">
        <div class="panel-dot"></div>
        <h2 class="panel-title"></h2>
      </div>
      <button class="panel-close" onclick="window._closePanel()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="panel-body"></div>
  `
  document.body.appendChild(panel)

  // Exposer sur window pour les handlers inline des popups Leaflet
  window._openSitePanel = _openPanel
  window._closePanel    = _closePanel

}

// ── Ouverture panel ───────────────────────────────────────────
async function _openPanel(name) {

  const panel  = document.getElementById("site-panel")
  const overlay = document.getElementById("panel-overlay")
  if (!panel) return

  // Loading state
  panel.classList.add("open")
  overlay.classList.add("open")
  panel.querySelector(".panel-title").textContent = name
  panel.querySelector(".panel-dot").style.background = "var(--primary)"
  panel.querySelector(".panel-body").innerHTML = `
    <div class="panel-loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>Chargement…</span>
    </div>`

  const cache   = await _loadDetails()
  const details = cache[name]

  if (!details) {
    panel.querySelector(".panel-body").innerHTML = `
      <div class="panel-empty">
        <i class="fa-regular fa-folder-open"></i>
        <span>Aucune information supplémentaire disponible pour ce site.</span>
      </div>`
    return
  }

  panel.querySelector(".panel-body").innerHTML = _renderDetails(details)

}

function _closePanel() {
  document.getElementById("site-panel")?.classList.remove("open")
  document.getElementById("panel-overlay")?.classList.remove("open")
}

// ── Rendu contenu panel ───────────────────────────────────────
function _renderDetails(d) {

  let html = ""

  // Horaires
  if (d.horaires) {
    const lines = d.horaires.split("\n").map(l => `<div class="panel-schedule-line">${l}</div>`).join("")
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-regular fa-clock"></i> Horaires
        </div>
        <div class="panel-schedule">${lines}</div>
      </div>`
  }

  // Équipements
  if (d.equipements?.length) {
    const items = d.equipements.map(e => `
      <div class="panel-equip-item">
        <i class="fa-solid fa-check-circle"></i>
        <span>${e}</span>
      </div>`).join("")
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-solid fa-stethoscope"></i> Équipements
        </div>
        <div class="panel-equip-list">${items}</div>
      </div>`
  }

  // Notes
  if (d.notes) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-regular fa-note-sticky"></i> Notes
        </div>
        <div class="panel-notes">${d.notes}</div>
      </div>`
  }

  // Lien fiche détaillée
  if (d.lien) {
    html += `
      <div class="panel-section panel-section-link">
        <a href="${d.lien}" target="_blank" rel="noopener" class="panel-link-btn">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          Voir la fiche détaillée
        </a>
      </div>`
  }

  return html || `<div class="panel-empty"><span>Aucune information disponible.</span></div>`

}

// ── Utils ─────────────────────────────────────────────────────
function _formatPhone(p) {
  return p.replace(/(\d{2})(?=\d)/g, "$1 ").trim()
}

function _esc(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;")
}
