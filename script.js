// === CONFIG ===
const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinets Omedys", checked: true },
        "Ouvertes": { color: "#3498db", label: "Salles Ouvertes", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecretariat", checked: true },
        "Ouverture en cours": { color: "#2ecc71", label: "En cours d'ouverture", checked: false },
    },
    tms: {
        isActive: false,
        filters: {
            "TMS 10": { label: "TMS 10 - Troyes", location: "Aube", count: 0, checked: false },
            "TMS 11": { label: "TMS 11 - Narbonne", location: "Aude", count: 0, checked: false },
            "TMS 14": { label: "TMS 14 - Caen", location: "Calvados", count: 0, checked: false },
            "TMS 18": { label: "TMS 18 - Bourges", location: "Cher", count: 0, checked: false },
            "TMS 21": { label: "TMS 21 - Dijon", location: "Côte-d'Or", count: 0, checked: false },
            "TMS 26": { label: "TMS 26 - Montélimar", location: "Drôme", count: 0, checked: false },
            "TMS 28": { label: "TMS 28 - Chartres", location: "Eure-et-Loir", count: 0, checked: false },
            "TMS 31": { label: "TMS 31 - Toulouse", location: "Haute-Garonne", count: 0, checked: false },
            "TMS 41": { label: "TMS 41 - Blois", location: "Loir-et-Cher", count: 0, checked: false },
            "TMS 54": { label: "TMS 54 - Nancy", location: "Meurthe-et-Moselle", count: 0, checked: false },
            "TMS 55": { label: "TMS 55 - Verdun", location: "Meuse", count: 0, checked: false },
            "TMS 59": { label: "TMS 59 - Lille", location: "Nord", count: 0, checked: false },
            "TMS 72": { label: "TMS 72 - Le Mans", location: "Sarthe", count: 0, checked: false },
            "TMS ESMS Emeis": { label: "TMS ESMS Emeis", location: "National", count: 0, checked: false }
        }
    },
    type: { ESMS: { label: "Afficher les ESMS", description: "EHPAD, Foyers, FAM...", count: 0, checked: false } }
};

// === INITIALISATION MAP ===
const map = L.map('map', { zoomControl: false, preferCanvas: true }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

const searchInput = document.getElementById('query');
const suggestionBox = document.getElementById('suggestions');
let markersStore = [];
let debounceTimer = null;

// === UTILITAIRES ===
const utils = {
    formatPhone: (num) => {
        if (!num) return "N/C";
        let cleaned = ('' + num).replace(/\D/g, '');
        if (cleaned.startsWith('33')) cleaned = '0' + cleaned.slice(2);
        if (cleaned.length === 9) cleaned = '0' + cleaned;
        return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ');
    },
    copyToClipboard: (text) => {
        navigator.clipboard.writeText(text).then(() => alert('✓ Copié !')).catch(() => console.error('Erreur'));
    },
    parseLocation: (loc) => {
        if (!loc) return null;
        try {
            const data = typeof loc === 'string' ? JSON.parse(loc) : loc;
            return (data.lat && data.lng) ? data : null;
        } catch (e) { return null; }
    }
};

// === CORE APP ===
async function startApp() {
    try {
        const index = await fetch('index.json').then(r => r.json());
        const datasets = await Promise.all(index.filter(e => e.visible).map(e => fetch(e.file).then(r => r.json())));
        const rawData = datasets.flatMap(d => d[0]?.data || []);

        rawData.forEach(item => {
            const loc = utils.parseLocation(item.Location);
            if (!loc) return;

            const statut = item.Statut_Salle || item.Statut || "N/C";
            const isESMS = /ESMS|EHPAD|Foyer|FAM|MAS/i.test(item.Type || "");
            const tmsKey = item.TMS || "";

            // Mise à jour compteurs
            if (CONFIG.tms.filters[tmsKey]) CONFIG.tms.filters[tmsKey].count++;
            if (isESMS) CONFIG.type.ESMS.count++;

            // Création du marqueur
            const color = CONFIG.status[statut]?.color || "#94a3b8";
            let marker;

            if (item.Type === "CABINET") {
                marker = L.marker([loc.lat, loc.lng], {
                    icon: L.divIcon({
                        className: 'custom-pin',
                        html: `<div style="width:36px;height:36px;background:var(--glass-bg);backdrop-filter:var(--glass-blur);border-radius:50%;border:2px solid var(--primary);display:flex;align-items:center;justify-content:center;color:var(--primary);box-shadow:var(--glass-shadow);"><i class="fa-solid fa-stethoscope"></i></div>`,
                        iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
                    })
                });
            } else {
                marker = L.circleMarker([loc.lat, loc.lng], {
                    radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9
                });
            }

            // Template Popup (bp3)
            const pillClass = statut.includes("Ouvert") ? "bp3-pill-ouvert" : statut.includes("cours") ? "bp3-pill-encours" : "bp3-pill-default";
            const phone = item.Phone || item.ATT_Phone || item.Telephone || '';
            const address = loc.address || "Adresse non disponible";

            const popupContent = `
                <div class="bp3">
                    <div class="bp3-header">
                        <div class="bp3-hd-top">
                            <span class="bp3-badge">${item.Type || 'Site'}</span>
                            <span class="bp3-statut-pill ${pillClass}"><span class="bp3-sdot"></span>${statut}</span>
                        </div>
                        <div class="bp3-title">${item.Name || "Sans nom"}</div>
                    </div>
                    <div class="bp3-grid">
                        <div class="bp3-tile bp3-wide">
                            <span class="bp3-tile-label">Responsable</span>
                            <span class="bp3-tile-value">${item.ATT_Name || item.ATT || "Non assigné"}</span>
                        </div>
                        <div class="bp3-tile">
                            <span class="bp3-tile-label">Téléphone</span>
                            <a href="tel:${phone}" class="bp3-tile-value bp3-link">${utils.formatPhone(phone)}</a>
                        </div>
                        <div class="bp3-tile">
                            <span class="bp3-tile-label">TMS</span>
                            <span class="bp3-tile-value">${tmsKey || 'N/A'}</span>
                        </div>
                        <div class="bp3-tile bp3-wide">
                            <span class="bp3-tile-label">Adresse</span>
                            <span class="bp3-tile-value">${address}</span>
                        </div>
                    </div>
                    <div class="bp3-footer">
                        <button class="bp3-btn bp3-btn--copy" onclick="utils.copyToClipboard('${address.replace(/'/g, "\\"')}')">Copier</button>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" class="bp3-btn bp3-btn--maps">Maps</a>
                    </div>
                </div>`;

            marker.bindPopup(popupContent, { maxWidth: 300, className: 'bp3-popup' });
            
            const markerEntry = { marker, status: statut, tms: tmsKey, isESMS, type: item.Type };
            markersStore.push(markerEntry);
            applyVisibility(markerEntry);
        });

        renderFilters();
    } catch (err) {
        console.error("Initialization failed", err);
    }
}

// === LOGIQUE DE FILTRES ===
function applyVisibility(item) {
    const isVisible = (CONFIG.status[item.status]?.checked !== false) &&
                      (!CONFIG.tms.isActive || item.type === "CABINET" || CONFIG.tms.filters[item.tms]?.checked) &&
                      (!item.isESMS || CONFIG.type.ESMS.checked);
    
    isVisible ? item.marker.addTo(map) : map.removeLayer(item.marker);
}

function renderFilters() {
    const container = document.getElementById('filter-list');
    if(!container) return;

    // Calcul dynamique des compteurs par statut pour l'affichage
    const statusHtml = Object.entries(CONFIG.status).map(([key, cfg]) => {
        const count = markersStore.filter(m => m.status === key).length;
        return `
            <div class="filter-item ${cfg.checked ? 'active' : ''}" onclick="toggleFilter('status', '${key}')">
                <div class="filter-dot" style="background:${cfg.color}"></div>
                <div class="filter-content">
                    <span class="filter-label">${cfg.label}</span>
                    <span class="filter-description">${count} sites</span>
                </div>
                <div class="filter-checkbox"></div>
            </div>`;
    }).join('');

    const tmsHtml = Object.entries(CONFIG.tms.filters).map(([key, cfg]) => `
        <div class="filter-item toggle-filter ${cfg.checked ? 'active' : ''}" onclick="toggleFilter('tms', '${key}')">
            <div class="filter-content">
                <span class="filter-label">${cfg.label}</span>
                <span class="filter-description">${cfg.location}</span>
            </div>
            <span class="tms-badge">${cfg.count}</span>
            <div class="toggle-switch"></div>
        </div>`).join('');

    container.innerHTML = `
        <div class="filter-section"><div class="section-title">Statuts</div>${statusHtml}</div>
        <div class="filters-divider"></div>
        <div class="filter-section"><div class="section-title">Centres TMS</div>${tmsHtml}</div>
    `;
    
    document.getElementById('site-count').textContent = markersStore.filter(m => map.hasLayer(m.marker)).length;
}

window.toggleFilter = (type, key) => {
    if (type === 'status') CONFIG.status[key].checked = !CONFIG.status[key].checked;
    if (type === 'tms') {
        CONFIG.tms.filters[key].checked = !CONFIG.tms.filters[key].checked;
        CONFIG.tms.isActive = Object.values(CONFIG.tms.filters).some(f => f.checked);
    }
    if (type === 'esms') CONFIG.type.ESMS.checked = !CONFIG.type.ESMS.checked;

    markersStore.forEach(applyVisibility);
    renderFilters();
};

// === RECHERCHE ===
async function fetchSuggestions(query) {
    try {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5&type=municipality`);
        const data = await r.json();
        suggestionBox.innerHTML = data.features.map(f => `
            <div class="suggestion-item" onclick="selectLoc(${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]}, '${f.properties.city.replace(/'/g, "\\'")}')">
                <span class="suggestion-city"><strong>${f.properties.city}</strong></span>
                <span class="suggestion-zip">${f.properties.postcode}</span>
            </div>`).join('');
    } catch (e) { suggestionBox.innerHTML = ''; }
}

window.selectLoc = (lat, lon, city) => {
    searchInput.value = city;
    suggestionBox.innerHTML = '';
    map.flyTo([lat, lon], 12);
};

searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    if (e.target.value.length < 2) return suggestionBox.innerHTML = '';
    debounceTimer = setTimeout(() => fetchSuggestions(e.target.value), 300);
});

// === INITIALISATION UI ===
document.addEventListener('DOMContentLoaded', () => {
    startApp();
    
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('bento-filters'); // Assure-toi que l'ID match ton HTML

    menuBtn?.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        sideMenu.classList.toggle('open');
    });
});
