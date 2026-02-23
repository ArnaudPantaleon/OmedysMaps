import {store} from "../core/store.js"

export function applyFilters(){

store.markers.forEach(marker=>{

const site = marker.site

let visible=true

if(store.filters.status[site.statut]===false){
visible=false
}

if(visible){
marker.addTo(window.map.cluster)
}else{
window.map.cluster.removeLayer(marker)
}

})

}