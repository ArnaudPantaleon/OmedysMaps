export function BP3Popup(site, color) {

  // Calcul de la classe de statut pour la pill
  const pillClass = {
    "Ouvert":             "bp3-pill-ouvert",
    "Ouverture en cours": "bp3-pill-encours",
    "Virtuel":            "bp3-pill-tele"
  }[site.status] || "bp3-pill-default"

  const badge = site.type === "salle" ? "Salle télémédecine" : "Cabinet TMS"

  // Ligne TMS rattaché (salles uniquement)
  const tmsTile = site.tms ? `
    <div class="bp3-tile">
      <div class="bp3-tile-label">Cabinet TMS</div>
      <div class="bp3-tile-value">${site.tms}</div>
    </div>` : ""

  // Ligne type de structure (salles)
  const typeTile = site.typeSite ? `
    <div class="bp3-tile">
      <div class="bp3-tile-label">Type</div>
      <div class="bp3-tile-value">${site.typeSite}</div>
    </div>` : ""

  // Contact
  const contactTile = site.contact?.name ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Contact</div>
      <div class="bp3-tile-value">${site.contact.name}</div>
    </div>` : ""

  // Mail
  const mailTile = site.contact?.mail ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Email</div>
      <div class="bp3-tile-value">
        <a class="bp3-link" href="mailto:${site.contact.mail}">${site.contact.mail}</a>
      </div>
    </div>` : ""

  // Téléphone
  const phoneTile = site.contact?.phone ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">Téléphone</div>
      <div class="bp3-tile-value">
        <a class="bp3-link" href="tel:${site.contact.phone}">${site.contact.phone}</a>
      </div>
    </div>` : ""

  // MSS
  const mssTile = site.mss ? `
    <div class="bp3-tile bp3-wide">
      <div class="bp3-tile-label">MSS</div>
      <div class="bp3-tile-value bp3-mss">${site.mss}</div>
    </div>` : ""

  // Lien Google Maps
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lng}`

  return `
<div class="bp3" style="--bp3-accent-glow:${color}33">

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
      onclick="navigator.clipboard.writeText('${(site.address || site.city).replace(/'/g, "\\'")}')">
      <i class="fa-regular fa-copy"></i> Copier
    </button>
    <a class="bp3-btn bp3-btn--maps" href="${mapsUrl}" target="_blank">
      <i class="fa-regular fa-map"></i> Maps
    </a>
  </div>

</div>`

}
