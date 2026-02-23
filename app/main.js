import {loadData} from "./data.js"
import {MapEngine} from "./map.js"
import {initSearch} from "./search.js"
import {initFilters} from "../ui/ui.filters.js"
import {initStats} from "../ui/ui.stats.js"

async function start(){

await loadData()

window.map = new MapEngine()

map.renderSites()

initSearch()

initFilters()

initStats()

}

start()