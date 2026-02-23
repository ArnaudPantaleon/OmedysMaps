import {store} from "../core/store.js"

export function initStats(){

const el = document.createElement("div")
el.className="bento-stats"

el.innerHTML=`
<small>SITES</small>
<span id="site-count">0</span>
`

document.body.appendChild(el)

updateStats()

}

export function updateStats(){

const el=document.getElementById("site-count")

if(!el) return

el.textContent = store.sites.length

}