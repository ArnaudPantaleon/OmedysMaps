import { setTheme, getTheme } from "../core/theme.js"

const LABELS = {
  light:  { icon: "☀️", label: "Clair"  },
  dark:   { icon: "🌙", label: "Sombre" },
  system: { icon: "⚙️", label: "Auto"   }
}

export function initThemeSwitcher() {

  // Tile bento dédiée
  const tile = document.createElement("div")
  tile.className = "bento-tile theme-switcher"

  const inner = document.createElement("div")
  inner.className = "theme-switcher-inner"

  const titleEl = document.createElement("span")
  titleEl.className = "theme-switcher-title"
  titleEl.textContent = "Apparence"
  inner.appendChild(titleEl)

  const btns = document.createElement("div")
  btns.className = "theme-switcher-btns"

  const current = getTheme()

  Object.entries(LABELS).forEach(([key, { icon, label }]) => {
    const btn = document.createElement("button")
    btn.className = "theme-btn" + (key === current ? " active" : "")
    btn.dataset.theme = key
    btn.innerHTML = `<span class="theme-btn-icon">${icon}</span><span class="theme-btn-label">${label}</span>`
    btn.addEventListener("click", () => {
      setTheme(key)
      // Mettre à jour l'état actif
      btns.querySelectorAll(".theme-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.theme === key)
      )
    })
    btns.appendChild(btn)
  })

  inner.appendChild(btns)
  tile.appendChild(inner)

  // Insérer à la fin du bento-wrapper
  const wrapper = document.querySelector(".bento-wrapper")
  if (wrapper) wrapper.appendChild(tile)

}
