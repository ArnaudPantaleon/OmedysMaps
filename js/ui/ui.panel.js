// ═══════════════════════════════════════════════════════════════
// ui.panel.js — Panel latéral (desktop) / bottom sheet (mobile)
// Remplace entièrement les popups Leaflet
// Les détails enrichis (horaires, équipements, lien, notes)
// sont lus directement depuis le site parsé (salles.json)
// ═══════════════════════════════════════════════════════════════

// ── Init DOM ──────────────────────────────────────────────────
export function initSitePanel() {

  if (document.getElementById("site-panel")) return

  // Overlay
  const overlay = document.createElement("div")
  overlay.id = "panel-overlay"
  overlay.addEventListener("click", closePanel)
  document.body.appendChild(overlay)

  // Panel
  const panel = document.createElement("div")
  panel.id = "site-panel"
  panel.innerHTML = `
    <div class="panel-handle"></div>
    <div class="panel-header">
      <div class="panel-header-left">
        <span class="panel-badge"></span>
        <span class="panel-statut-pill"><span class="panel-sdot"></span><span class="panel-statut-label"></span></span>
      </div>
      <button class="panel-close" id="panel-close-btn">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="panel-title-row">
      <div class="panel-accent-dot"></div>
      <h2 class="panel-title"></h2>
    </div>
    <div class="panel-body"></div>
    <div class="panel-actions"></div>
  `
  document.body.appendChild(panel)

  document.getElementById("panel-close-btn")
    .addEventListener("click", closePanel)

  // Swipe down pour fermer (mobile)
  _initSwipe(panel)
}

// ── Ouverture ─────────────────────────────────────────────────
export function openSitePanel(site, color) {

  initSitePanel()

  const panel   = document.getElementById("site-panel")
  const overlay = document.getElementById("panel-overlay")

  const pillClass = {
    "Ouvert":                 "bp3-pill-ouvert",
    "Ouvertes":               "bp3-pill-ouvert",
    "ESMS ouvert au public":  "bp3-pill-ouvert",
    "Ouverture en cours":     "bp3-pill-encours",
    "Telesecretariat OMEDYS": "bp3-pill-tele"
  }[site.status] || "bp3-pill-default"

  panel.querySelector(".panel-badge").textContent        = site.type === "salle" ? "Salle télémédecine" : "Cabinet TMS"
  panel.querySelector(".panel-statut-pill").className    = `panel-statut-pill ${pillClass}`
  panel.querySelector(".panel-statut-label").textContent = site.status
  panel.querySelector(".panel-accent-dot").style.background = color
  panel.querySelector(".panel-title").textContent        = site.name
  panel.style.setProperty("--panel-accent", color)

  panel.querySelector(".panel-body").innerHTML    = _renderBase(site) + _renderDetails(site)
  panel.querySelector(".panel-actions").innerHTML = _renderActions(site)

  panel.classList.add("open")
  overlay.classList.add("open")

}

export function closePanel() {
  document.getElementById("site-panel")?.classList.remove("open")
  document.getElementById("panel-overlay")?.classList.remove("open")
}

// ── Sections ──────────────────────────────────────────────────

function _renderBase(site) {
  let html = ""

  // Adresse
  if (site.address || site.city) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-solid fa-location-dot"></i> Adresse
        </div>
        <div class="panel-info-block">${site.address || site.city}</div>
      </div>`
  }

  // TMS rattaché
  if (site.tms) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-solid fa-hospital"></i> Cabinet TMS
        </div>
        <div class="panel-info-block">${site.tms}</div>
      </div>`
  }

  // Type de structure
  if (site.typeSite) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-solid fa-tag"></i> Type
        </div>
        <div class="panel-info-block">${site.typeSite}</div>
      </div>`
  }

  // Contact
  const hasContact = site.contact?.name || site.contact?.mail || site.contact?.phone
  if (hasContact) {
    html += `<div class="panel-section">
      <div class="panel-section-title"><i class="fa-solid fa-user"></i> Contact</div>
      <div class="panel-contact-block">`
    if (site.contact.name)  html += `<div class="panel-contact-line"><i class="fa-regular fa-user"></i>${site.contact.name}</div>`
    if (site.contact.phone) html += `<div class="panel-contact-line"><i class="fa-solid fa-phone"></i><a class="panel-link" href="tel:${site.contact.phone}">${_formatPhone(site.contact.phone)}</a></div>`
    if (site.contact.mail)  html += `<div class="panel-contact-line"><i class="fa-regular fa-envelope"></i><a class="panel-link" href="mailto:${site.contact.mail}">${site.contact.mail}</a></div>`
    html += `</div></div>`
  }

  // MSS
  if (site.mss) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-solid fa-shield-halved"></i> MSS
        </div>
        <div class="panel-info-block panel-mss">${site.mss}</div>
      </div>`
  }

  return html
}

function _renderDetails(site) {
  let html = ""

  if (site.horaires) {
    const lines = site.horaires.split("\n")
      .map(l => `<div class="panel-schedule-line">${l}</div>`).join("")
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-regular fa-clock"></i> Horaires
        </div>
        <div class="panel-schedule">${lines}</div>
      </div>`
  }

  if (site.equipements?.length) {
    const items = site.equipements.map(e => `
      <div class="panel-equip-item">
        <i class="fa-solid fa-circle-check"></i><span>${e}</span>
      </div>`).join("")
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-solid fa-stethoscope"></i> Équipements
        </div>
        <div class="panel-equip-list">${items}</div>
      </div>`
  }

  if (site.notes) {
    html += `
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="fa-regular fa-note-sticky"></i> Notes
        </div>
        <div class="panel-notes">${site.notes}</div>
      </div>`
  }

  return html
}

function _renderActions(site) {
  const addr    = site.address || site.city || ""
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lng}`

  let html = `
    <button class="panel-action-btn panel-action--copy"
      onclick="window._panelCopy('${addr.replace(/'/g, "\\'")}')">
      <i class="fa-regular fa-copy"></i><span>Copier</span>
    </button>
    <a class="panel-action-btn panel-action--maps" href="${mapsUrl}" target="_blank" rel="noopener">
      <i class="fa-regular fa-map"></i><span>Maps</span>
    </a>`

  if (site.lien) {
    html += `
      <a class="panel-action-btn panel-action--link" href="${site.lien}" target="_blank" rel="noopener">
        <i class="fa-solid fa-arrow-up-right-from-square"></i><span>Fiche</span>
      </a>`
  }

  return html
}

// ── Swipe to close (mobile) ───────────────────────────────────
function _initSwipe(panel) {
  let startY = 0
  let isDragging = false

  panel.addEventListener("touchstart", e => {
    // Seulement si on touche le handle ou le header
    if (!e.target.closest(".panel-handle, .panel-header, .panel-title-row")) return
    startY = e.touches[0].clientY
    isDragging = true
    panel.style.transition = "none"
  }, { passive: true })

  panel.addEventListener("touchmove", e => {
    if (!isDragging) return
    const dy = e.touches[0].clientY - startY
    if (dy > 0) panel.style.transform = `translateY(${dy}px)`
  }, { passive: true })

  panel.addEventListener("touchend", e => {
    if (!isDragging) return
    isDragging = false
    panel.style.transition = ""
    const dy = e.changedTouches[0].clientY - startY
    if (dy > 100) {
      panel.style.transform = ""
      closePanel()
    } else {
      panel.style.transform = ""
    }
  })
}

// ── Utils ─────────────────────────────────────────────────────

// Exposé sur window pour le onclick inline du bouton Copier
window._panelCopy = function(text) {
  navigator.clipboard.writeText(text).then(() => _showToast("Adresse copiée !"))
}

function _showToast(msg) {
  // Réutiliser un toast existant s'il est encore visible
  let toast = document.getElementById("panel-toast")
  if (!toast) {
    toast = document.createElement("div")
    toast.id = "panel-toast"
    document.body.appendChild(toast)
  }
  toast.textContent = msg
  toast.classList.remove("panel-toast--out")
  toast.classList.add("panel-toast--in")

  clearTimeout(toast._timer)
  toast._timer = setTimeout(() => {
    toast.classList.replace("panel-toast--in", "panel-toast--out")
  }, 2000)
}

function _formatPhone(p) {
  return (p || "").replace(/(\d{2})(?=\d)/g, "$1 ").trim()
}
