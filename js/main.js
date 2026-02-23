import {loadData} from "./data/data.loader.js"
import {MapEngine} from "./map/map.engine.js"
import {initStats} from "./ui/ui.stats.js"
import {initFilters} from "./ui/ui.filters.js"

async function start(){

await loadData()

const map = new MapEngine()

map.renderSites()

initStats()
initFilters()

}

start()
