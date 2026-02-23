import {formatPhone,escapeHTML} from "../core/utils.js"

export function BP3Popup(site,color){

return `
<div class="bp3">

<div class="bp3-header" style="--bp3-accent-glow:${color}40">

<div class="bp3-title">
${escapeHTML(site.name)}
</div>

</div>

<div class="bp3-grid">

<div class="bp3-tile">
<div class="bp3-tile-label">Téléphone</div>
<div class="bp3-tile-value">
<a href="tel:${site.phone}">
${formatPhone(site.phone)}
</a>
</div>
</div>

<div class="bp3-tile bp3-wide">
<div class="bp3-tile-label">Adresse</div>
<div class="bp3-tile-value">
${escapeHTML(site.address)}
</div>
</div>

</div>

</div>
`
}