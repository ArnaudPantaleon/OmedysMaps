import { CONFIG } from "../core/config.js"
import { store }  from "../core/store.js"

export function initFilters(map) {

  // Initialiser l'état des filtres depuis CONFIG
  Object.entries(CONFIG.status).forEach(([key, val]) => {
    store.filters.status[key] = val.checked
  })

  // Construire le DOM bento attendu par le CSS
  const wrapper = document.createElement("div")
  wrapper.className = "bento-wrapper"

  // --- Ligne 1 : bouton hamburger + stats ---
  const row = document.createElement("div")
  row.className = "bento-row"

  // Bouton hamburger
  const menuBtn = document.createElement("button")
  menuBtn.className = "bento-tile bento-action"
  menuBtn.id = "menu-btn"
  menuBtn.innerHTML = `<span class="bar"></span><span class="bar"></span><span class="bar"></span>`

  // Stats
  const statsTile = document.createElement("div")
  statsTile.className = "bento-tile bento-stats"
  statsTile.style.flex = "1"
  statsTile.innerHTML = `<small>SITES AFFICHÉS</small><span id="site-count">0</span>`

  row.appendChild(menuBtn)
  row.appendChild(statsTile)
  wrapper.appendChild(row)

  // --- Menu filtres ---
  const filtersTile = document.createElement("div")
  filtersTile.className = "bento-tile bento-filters"
  filtersTile.id = "filter-list"

  const section = document.createElement("div")
  section.className = "filter-section"
  section.innerHTML = `<div class="section-title">Statut</div>`

  const grid = document.createElement("div")
  grid.className = "filters-grid"

  Object.entries(CONFIG.status).forEach(([key, val]) => {

    const item = document.createElement("div")
    item.className = "filter-item color-filter" + (val.checked ? " active" : "")

    item.innerHTML = `
      <div class="filter-dot" style="background:${val.color}"></div>
      <div class="filter-content">
        <span class="filter-label">${key}</span>
        <span class="filter-description">${_countByStatus(key)} site(s)</span>
      </div>
      <div class="filter-checkbox"></div>
    `

    item.addEventListener("click", () => {

      store.filters.status[key] = !store.filters.status[key]
      item.classList.toggle("active")

      map.applyFilters()

      // Mettre à jour les descriptions
      document.querySelectorAll(".filter-description").forEach((el, i) => {
        const k = Object.keys(CONFIG.status)[i]
        if (k) el.textContent = `${_countByStatus(k)} site(s)`
      })

    })

    grid.appendChild(item)

  })

  section.appendChild(grid)
  filtersTile.appendChild(section)
  wrapper.appendChild(filtersTile)

  // Toggle menu
  menuBtn.addEventListener("click", () => {
    menuBtn.classList.toggle("active")
    filtersTile.classList.toggle("open")
  })

  document.body.appendChild(wrapper)

}

function _countByStatus(status) {
  return store.sites.filter(s => s.status === status).length
}
