import {CONFIG} from "../core/config.js"
import {store} from "../core/store.js"
import {BP3Popup} from "../ui/popup.bp3.js"
import {updateStats} from "../ui/ui.stats.js"
export class MapEngine{

constructor(){
  this.map=L.map("map",{zoomControl:false})
  .setView(CONFIG.map.center,CONFIG.map.zoom)
  
  L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  ).addTo(this.map)
  
  this.cluster = L.markerClusterGroup()
  this.map.addLayer(this.cluster)


  renderSites(){
  
  store.sites.forEach(site=>{
  
  const color = CONFIG.status[site.statut]?.color || "#94a3b8"
  
  const marker=L.circleMarker(
  [site.lat,site.lng],
  {
  radius:7,
  fillColor:color,
  color:"#fff",
  weight:2,
  fillOpacity:.9
  })
  
  marker.site = site
  
  marker.bindPopup(
  BP3Popup(site,color),
  {maxWidth:340}
  )
  
  this.cluster.addLayer(marker)
  
  store.markers.push(marker)
  
  })
  updateStats()
  }
}

