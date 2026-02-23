import { store }  from "../core/store.js"
import { CONFIG } from "../core/config.js"

export function initStats() {
  updateStats()
}

export function updateStats() {

  const el = document.getElementById("site-count")
  if (!el) return

  const count = store.sites.filter(site => {
    const f = store.filters
    if (site.type === "cabinet") {
      if (!f.dataset.cabinet) return false
      if (f.statusCabinet[site.status] === false) return false
    }
    if (site.type === "salle") {
      if (!f.dataset.salle) return false
      if (f.statusSalle[site.status] === false) return false
      if (site.typeSite && f.typeSite[site.typeSite] === false) return false
      if (site.tms && f.tms[site.tms] === false) return false
    }
    if (f.departement && site.dept !== f.departement) return false
    if (f.region) {
      const depts = store.deptsByRegion?.[f.region] || []
      if (!depts.includes(site.dept)) return false
    }
    return true
  }).length

  el.textContent = count

}
