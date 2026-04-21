import { initTheme, getTheme } from "./core/theme.js" // Ajout de getTheme ici
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
  window.mapInstance = map; // Important pour que ui.theme.js puisse y accéder
  map.renderSites()
  
  map.updateTheme(getTheme())

  initFilters(map, zones)
  initSearch(map)
  initStats()
  initThemeSwitcher()

  window.addEventListener("theme-changed", (e) => {
    map.updateTheme(e.detail.theme);
  });
  // Gestion du changement de mode système en temps réel
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getTheme() === "system") {
      map.updateTheme("system")
    }
  })
}

start()
