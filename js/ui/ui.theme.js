import { setTheme, getTheme } from "../core/theme.js"

const LABELS = {
  light:  { icon: "fa-sun",     label: "Clair"  },
  dark:   { icon: "fa-moon",    label: "Sombre" },
  system: { icon: "fa-display", label: "Auto"   }
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
    btn.innerHTML = `<i class="fa-regular ${icon} theme-btn-icon"></i><span class="theme-btn-label">${label}</span>`
    
    btn.addEventListener("click", () => {
      setTheme(key); // Cela va maintenant déclencher l'événement global
      
      // Mise à jour visuelle des boutons uniquement
      btns.querySelectorAll(".theme-btn").forEach(b =>
        b.classList.toggle("active", b.dataset.theme === key)
      );
    });
    btns.appendChild(btn)
  })

  inner.appendChild(btns)
  tile.appendChild(inner)

  // Insérer à la fin du bento-wrapper
  const wrapper = document.querySelector(".bento-wrapper")
  if (wrapper) wrapper.appendChild(tile)
}
