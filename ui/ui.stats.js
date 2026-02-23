import {store} from "../core/store.js"

export function initStats(){

const container = document.getElementById("ui")

container.insertAdjacentHTML("beforeend",`

<div class="bento-tile bento-stats">

<small>SITES</small>
<span id="site-count">0</span>

</div>

`)

updateStats()

}

export function updateStats(){

const el = document.getElementById("site-count")

if(!el) return

el.innerText = store.markers.length

}