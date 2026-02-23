import { initTheme }        from "./core/theme.js"
import { loadData }         from "./data/data.loader.js"
import { MapEngine }        from "./map/map.engine.js"
import { initFilters }      from "./ui/ui.filters.js"
import { initSearch }       from "./ui/ui.search.js"
import { initStats }        from "./ui/ui.stats.js"
import { initThemeSwitcher } from "./ui/ui.theme.js"

// Appliquer le thème AVANT tout rendu pour éviter le flash
initTheme()

async function start() {

  await loadData()

  const zones = await fetch("/data/zones.json").then(r => r.json()).catch(() => null)
  window._zonesCache = zones

  const map = new MapEngine()
  map.renderSites()

  initFilters(map, zones)
  initSearch(map)
  initStats()
  initThemeSwitcher()

}

start()
