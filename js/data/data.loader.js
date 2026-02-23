import {store} from "../core/store.js"
import {parseCabinet} from "./parser.cabinets.js"
import {parseSalle} from "./parser.salles.js"

export async function loadData(){

const res = await fetch("/data/index.json")
const datasets = await res.json()

store.datasets = datasets

for(const dataset of datasets){

if(!dataset.visible) continue

const data = await fetch(dataset.file).then(r=>r.json())

const rows = data[0]?.data || data.data || []

let parsed=[]

if(dataset.file.includes("cabinet"))
parsed = rows.map(parseCabinet)

if(dataset.file.includes("salle"))
parsed = rows.map(parseSalle)

parsed = parsed.filter(Boolean)

parsed.forEach(p=>p.dataset=dataset.label)

store.sites.push(...parsed)

}

}