// ── Chargement du cache details ───────────────────────────────
let _detailsCache = null

async function _loadDetails() {
  if (_detailsCache) return _detailsCache
  try {
    const arr = await fetch("/data/json/details.json").then(r => r.json())
    _detailsCache = {}
    arr.forEach(d => { _detailsCache[d.name] = d })
  } catch {
    _detailsCache = {}
  }
  return _detailsCache
}

_loadDetails()

// ── Exposer sur window DÈS le chargement du module ───────────
// Les onclick="" des popups Leaflet (HTML string) ont besoin que
// window._openSitePanel existe avant tout clic utilisateur.
window._openSitePanel = _openPanel
window._closePanel    = _closePanel

// ── Popup BP3 ─────────────────────────────────────────────────
export function BP3Popup(site, color) {

  const pillClass = {
    "Ouvert":                 "bp3-pill-ouvert",
    "Ouvertes":               "bp3-pill-ouvert",
    "ESMS ouvert au public":  "bp3-pill-ouvert",
    "Ouverture en cours":     "bp3-pill-encours",
    "Telesecretariat OMEDYS": "bp3-pill-tele"
  }[site.status] || "bp3-pill-default"

  const badge = site.type === "salle" ? "Salle télémédecine" : "Cabinet TMS"

  const tmsTile = site.tms ? `
    <div class="bp3-tile">
      <div class="bp3-tile-label">Cabinet TMS</div>
      <div class="bp3-tile-value">${site.tms}</div>
    </div>` : ""

  const typeTile = site.typeSite ? `
    <div class="bp3-tile">
      <div class="bp3-tile-label">Type</div>
      <div class="bp3-tile-value">${site.typeSite}</div>
    </div>` : ""

  const contactTile = site.contact?.name ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Contact</div>
      <div class="bp3-tile-value">${site.contact.name}</div>
    </div>` : ""

  const mailTile = site.contact?.mail ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Email</div>
      <div class="bp3-tile-value">
        <a class="bp3-link" href="mailto:${site.contact.mail}">${site.contact.mail}</a>
      </div>
    </div>` : ""

  const phoneTile = site.contact?.phone ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Téléphone</div>
      <div class="bp3-tile-value">
        <a class="bp3-link" href="tel:${site.contact.phone}">${site.contact.phone}</a>
      </div>
    </div>` : ""

  const mssTile = site.mss ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">MSS</div>
      <div class="bp3-tile-value bp3-mss">${site.mss}</div>
    </div>` : ""

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lng}`

  const infoBtn = site.type === "salle" ? `
    <button class="bp3-btn bp3-btn--info" onclick="window._openSitePanel('${_esc(site.name)}')">
      <i class="fa-solid fa-circle-info"></i> Infos
    </button>` : ""

  return `
<div class="bp3" style="--bp3-accent-glow:${color}48">

  <div class="bp3-header">
    <div class="bp3-hd-top">
      <span class="bp3-badge">${badge}</span>
      <span class="bp3-statut-pill ${pillClass}">
        <span class="bp3-sdot"></span>${site.status}
      </span>
    </div>
    <div class="bp3-title">${site.name}</div>
  </div>

  <div class="bp3-grid">

    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Adresse</div>
      <div class="bp3-tile-value">${site.address || site.city || "—"}</div>
    </div>

    ${tmsTile}
    ${typeTile}
    ${contactTile}
    ${phoneTile}
    ${mailTile}
    ${mssTile}

  </div>

  <div class="bp3-footer">
    <button class="bp3-btn bp3-btn--copy"
      onclick="navigator.clipboard.writeText('${(site.address || site.city || "").replace(/'/g, "\\'")}')">
      <i class="fa-regular fa-copy"></i> Copier
    </button>
    <a class="bp3-btn bp3-btn--maps" href="${mapsUrl}" target="_blank">
      <i class="fa-regular fa-map"></i> Maps
    </a>
    ${infoBtn}
  </div>

</div>`

}

// ── Panel latéral ─────────────────────────────────────────────
export function initSitePanel() {

  // Overlay
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

}

// ── Ouverture panel ───────────────────────────────────────────
async function _openPanel(name) {

  // Créer le panel à la volée si initSitePanel() n'a pas encore été appelé
  if (!document.getElementById("site-panel")) {
    initSitePanel()
  }

  const panel   = document.getElementById("site-panel")
  const overlay = document.getElementById("panel-overlay")

  panel.classList.add("open")
  overlay.classList.add("open")
  panel.querySelector(".panel-title").textContent = name
  panel.querySelector(".panel-body").innerHTML = `
    <div class="panel-loading">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>Chargement…</span>
    </div>`

  const cache   = await _loadDetails()
  const details = cache[name]

  panel.querySelector(".panel-body").innerHTML = details
    ? _renderDetails(details)
    : `<div class="panel-empty">
         <i class="fa-regular fa-folder-open"></i>
         <span>Aucune information supplémentaire disponible pour ce site.</span>
       </div>`
}

function _closePanel() {
  document.getElementById("site-panel")?.classList.remove("open")
  document.getElementById("panel-overlay")?.classList.remove("open")
}

// ── Rendu contenu panel ───────────────────────────────────────
function _renderDetails(d) {

  let html = ""

  if (d.horaires) {
    const lines = d.horaires.split("\n")
      .map(l => `<div class="panel-schedule-line">${l}</div>`).join("")
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-regular fa-clock"></i> Horaires
        </div>
        <div class="panel-schedule">${lines}</div>
      </div>`
  }

  if (d.equipements?.length) {
    const items = d.equipements
      .map(e => `
        <div class="panel-equip-item">
          <i class="fa-solid fa-circle-check"></i>
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

  if (d.notes) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-regular fa-note-sticky"></i> Notes
        </div>
        <div class="panel-notes">${d.notes}</div>
      </div>`
  }

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
function _esc(str) {
  return (str || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;")
}
