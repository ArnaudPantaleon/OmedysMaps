export function BP3Popup(site,color){

return `

<div class="bp3">

<div class="bp3-header">

<div class="bp3-dot" style="background:${color}"></div>

<div class="bp3-title">
${site.name}
</div>

</div>

<div class="bp3-body">

<div>${site.address || ""}</div>
<div>${site.city || ""}</div>

${site.meta?.structure ? `<div>${site.meta.structure}</div>` : ""}

</div>

</div>

`

}
