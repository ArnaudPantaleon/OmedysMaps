import {parseLocation} from "../core/utils.js"
import {store} from "../core/store.js"

export async function loadData(){

const index = await fetch("../json/index.json").then(r=>r.json())

const visible=index.filter(x=>x.visible)

const datasets=await Promise.all(
visible.map(e=>fetch(e.file).then(r=>r.json()))
)

const raw=datasets.flatMap(d=>d[0]?.data || [])

store.sites = raw
.map(normalize)
.filter(Boolean)

}

function normalize(item){

const loc=parseLocation(item.Location)

if(!loc) return null

return {

name:item.Name || "Site",
type:item.Type || "",
statut:item.Statut || item.Statut_Salle || "",
lat:parseFloat(loc.lat),
lng:parseFloat(loc.lng),
address:loc.address || "",
phone:item.Phone || item.Telephone || "",
mss:item.MSS || "",
att:item.ATT || "",
tms:item.TMS || ""

}

}