import { store }  from "../core/store.js"
import { CONFIG } from "../core/config.js"

export function initStats() {
  // Le DOM des stats est maintenant créé dans ui.filters.js (bento layout)
  // On s'assure juste que updateStats() est appelé une première fois
  updateStats()
}

export function updateStats() {

  const el = document.getElementById("site-count")
  if (!el) return

  // Compter uniquement les sites dont le filtre est actif
  const count = store.sites.filter(site => {
    const f = store.filters.status[site.status]
    return f !== false  // undefined (statut inconnu) = visible par défaut
  }).length

  el.textContent = count

}
