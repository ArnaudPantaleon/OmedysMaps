import Fuse from "https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.mjs"
import {store} from "../core/store.js"

let fuse

export function initSearch(){

fuse = new Fuse(store.sites,{
keys:["name","address","tms"],
threshold:0.3
})

}

export function search(query){

return fuse.search(query).slice(0,10)

}