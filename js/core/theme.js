// ─── Thème : light | dark | system ───────────────────────────────────────────
// Applique data-theme="light"|"dark" sur <html>
// "system" suit prefers-color-scheme en temps réel

const STORAGE_KEY = "omedys-theme"
const THEMES      = ["light", "dark", "system"]

let _current = "system"
let _mq       = null  // MediaQueryList pour le mode system

// ── Appliquer le thème effectif sur <html> ──────────────────────────────────
function _apply(theme) {
  const root = document.documentElement
  let isDark

  if (theme === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.setAttribute("data-theme", isDark ? "dark" : "light")
  } else {
    isDark = theme === "dark"
    root.setAttribute("data-theme", theme)
  }

  // Classe utilitaire pour les sélecteurs CSS html.is-dark
  root.classList.toggle("is-dark", isDark)
}

// ── Écouter les changements système quand on est en mode "system" ────────────
function _watchSystem(active) {
  if (!_mq) _mq = window.matchMedia("(prefers-color-scheme: dark)")
  if (active) {
    _mq.addEventListener("change", _onSystemChange)
  } else {
    _mq.removeEventListener("change", _onSystemChange)
  }
}

function _onSystemChange() {
  if (_current === "system") _apply("system")
}

// ── API publique ─────────────────────────────────────────────────────────────
export function setTheme(theme) {
  if (!THEMES.includes(theme)) return
  _current = theme
  localStorage.setItem(STORAGE_KEY, theme)
  _apply(theme)
  _watchSystem(theme === "system")
}

export function getTheme() {
  return _current
}

// ── Init (appelé au démarrage) ───────────────────────────────────────────────
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || "system"
  setTheme(saved)
}
