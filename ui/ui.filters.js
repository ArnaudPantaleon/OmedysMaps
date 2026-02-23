import {CONFIG} from "../core/config.js"
import {store} from "../core/store.js"
import {applyFilters} from "../app/filters.js"

export function initFilters(){

const container = document.getElementById("ui")

container.insertAdjacentHTML("beforeend",`

<div class="bento-wrapper">

<div class="bento-tile">

<div class="section-title">
Statuts
</div>

<div id="filter-status"></div>

</div>

</div>

`)

renderStatusFilters()

}

function renderStatusFilters(){

const el = document.getElementById("filter-status")

el.innerHTML = ""

Object.entries(CONFIG.status).forEach(([key,conf])=>{

store.filters.status[key] = conf.checked

const item = document.createElement("div")
item.className = "filter-item"

item.innerHTML = `
<span class="filter-dot" style="background:${conf.color}"></span>
${key}
`

item.onclick = ()=>{

store.filters.status[key] = !store.filters.status[key]

item.classList.toggle("active")

applyFilters()

}

el.appendChild(item)

})

}