import { initTheme }        from "./core/theme.js"
import { loadData }         from "./data/data.loader.js"
import { MapEngine }        from "./map/map.engine.js"
import { initFilters }      from "./ui/ui.filters.js"
import { initSearch }       from "./ui/ui.search.js"
import { initStats }        from "./ui/ui.stats.js"
import { initThemeSwitcher } from "./ui/ui.theme.js"
import { initSitePanel }    from "./ui/ui.panel.js"

initTheme()

async function start() {

  initSitePanel()

  await loadData()

  const zones = await fetch("/data/json/zones.json").then(r => r.json()).catch(() => null)
  window._zonesCache = zones

  const map = new MapEngine()
  map.renderSites()
  window.addEventListener("themechanged", (e) => {
  mapEngine.updateMapTheme(e.detail.theme);
  });
  
  // Appel initial pour synchroniser au chargement
  mapEngine.updateMapTheme(getTheme());
  initFilters(map, zones)
  initSearch(map)
  initStats()
  initThemeSwitcher()

}

start()
