import {CONFIG} from "../core/config.js"
import {store} from "../core/store.js"

export function initFilters(){

const container=document.createElement("div")
container.className="filters"

Object.entries(CONFIG.status).forEach(([key,val])=>{

store.filters.status[key]=val.checked

const btn=document.createElement("button")

btn.textContent=key
btn.className="filter"

btn.onclick=()=>{

store.filters.status[key]=!store.filters.status[key]

btn.classList.toggle("active")

}

container.appendChild(btn)

})

document.body.appendChild(container)

}
