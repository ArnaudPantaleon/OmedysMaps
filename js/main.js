import { loadData }   from "./data/data.loader.js"
import { MapEngine }  from "./map/map.engine.js"
import { initFilters } from "./ui/ui.filters.js"
import { initStats }   from "./ui/ui.stats.js"

async function start() {

  await loadData()

  const map = new MapEngine()
  map.renderSites()

  initFilters(map)
  initStats()

}

start()
