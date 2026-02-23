import { loadData }   from "./data/data.loader.js"
import { MapEngine }  from "./map/map.engine.js"
import { initFilters } from "./ui/ui.filters.js"
import { initSearch }  from "./ui/ui.search.js"
import { initStats }   from "./ui/ui.stats.js"

async function start() {

  // Charger les données sites
  await loadData()

  // Charger zones (régions + départements) pour les filtres géo
  const zones = await fetch("/data/zones.json").then(r => r.json()).catch(() => null)
  window._zonesCache = zones  // cache pour le reset des filtres

  // Carte
  const map = new MapEngine()
  map.renderSites()

  // UI
  initFilters(map, zones)
  initSearch(map)
  initStats()

}

start()
