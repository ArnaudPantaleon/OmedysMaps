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
    type: {
        ESMS: { label: "Afficher les ESMS", description: "EHPAD, Foyers, FAM...", count: 0, checked: false }
    }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const searchInput = document.getElementById('query');
const suggestionBox = document.getElementById('suggestions');
let debounceTimer = null;
let markersStore = [];

// === UTILITAIRES ===
function formatPhone(num) {
    if (!num) return "N/C";
    let cleaned = ('' + num).replace(/\D/g, '');
    if (cleaned.startsWith('33') && cleaned.length === 11) cleaned = '0' + cleaned.slice(2);
    if (cleaned.length === 9) cleaned = '0' + cleaned;
    return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ');
}

function copyAddress(address) {
    navigator.clipboard.writeText(address).then(() => alert('✓ Adresse copiée !'));
}

// === APP ===
async function startApp() {
    try {
        const index = await fetch('index.json').then(r => r.json());
        const datasets = await Promise.all(index.filter(e => e.visible).map(e => fetch(e.file).then(r => r.json())));
        const rawData = datasets.flatMap(d => d[0]?.data || []);

        rawData.forEach(item => {
            let locData = null;
            try {
                locData = typeof item.Location === 'string' ? JSON.parse(item.Location) : item.Location;
            } catch(e) {}

            if (locData && locData.lat) {
                const lat = parseFloat(locData.lat);
                const lng = parseFloat(locData.lng);
                const address = locData.address || "Non disponible";
                const statut = item.Statut_Salle || item.Statut || "N/C";
                const tmsKey = item.TMS || "";
                const isESMS = ["ESMS", "EHPAD", "Foyer", "FAM", "MAS"].some(t => (item.Type || "").toUpperCase().includes(t));

                if (CONFIG.tms.filters[tmsKey]) CONFIG.tms.filters[tmsKey].count++;
                if (isESMS) CONFIG.type.ESMS.count++;

                const color = CONFIG.status[statut]?.color || "#94a3b8";
                let marker;

                if (item.Type === "CABINET") {
                    marker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: '',
                            html: `<div style="width:36px;height:36px;background:var(--glass-bg);backdrop-filter:var(--glass-blur);border-radius:50%;border:2px solid var(--primary);display:flex;align-items:center;justify-content:center;color:var(--primary);box-shadow:var(--glass-shadow);"><i class="fa-solid fa-stethoscope"></i></div>`,
                            iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
                        })
                    });
                } else {
                    marker = L.circleMarker([lat, lng], { radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9 });
                }

                const pillClass = statut.includes("Ouvert") ? "bp3-pill-ouvert" : statut.includes("cours") ? "bp3-pill-encours" : "bp3-pill-default";
                const phone = item.Phone || item.ATT_Phone || item.Telephone || '';
                
                // Correction URL Maps ici
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

                const popupContent = `
                    <div class="bp3">
                        <div class="bp3-header">
                            <div class="bp3-hd-top">
                                <div class="bp3-badge">${item.Type || "Site"}</div>
                                <div class="bp3-statut-pill ${pillClass}"><span class="bp3-sdot"></span>${statut}</div>
                            </div>
                            <div class="bp3-title">${item.Name || "Site"}</div>
                        </div>
                        <div class="bp3-grid">
                            <div class="bp3-tile bp3-wide">
                                <span class="bp3-tile-label">Responsable</span>
                                <div class="bp3-tile-value">${item.ATT_Name || item.ATT || "Non assigné"}</div>
                            </div>
                            <div class="bp3-tile">
                                <span class="bp3-tile-label">Téléphone</span>
                                <a href="tel:${phone}" class="bp3-tile-value bp3-link">${formatPhone(phone)}</a>
                            </div>
                            <div class="bp3-tile">
                                <span class="bp3-tile-label">TMS</span>
                                <div class="bp3-tile-value">${tmsKey || 'N/A'}</div>
                            </div>
                            <div class="bp3-tile bp3-wide">
                                <span class="bp3-tile-label">Adresse</span>
                                <div class="bp3-tile-value">${address}</div>
                            </div>
                        </div>
                        <div class="bp3-footer">
                            <button class="bp3-btn bp3-btn--copy" onclick="copyAddress('${address.replace(/'/g, "\\'")}')">Copier</button>
                            <a href="${mapsUrl}" target="_blank" class="bp3-btn bp3-btn--maps">Maps</a>
                        </div>
                    </div>`;

                marker.bindPopup(popupContent, { maxWidth: 300, className: 'bp3-popup' });
                const entry = { marker, status: statut, tms: tmsKey, isESMS, type: item.Type || "" };
                markersStore.push(entry);
                applyVisibility(entry);
            }
        });
        renderFilters();
    } catch (e) { console.error(e); }
}

function applyVisibility(item) {
    const show = (CONFIG.status[item.status]?.checked !== false) &&
                 (!CONFIG.tms.isActive || item.type === "CABINET" || CONFIG.tms.filters[item.tms]?.checked) &&
                 (!item.isESMS || CONFIG.type.ESMS.checked);
    show ? item.marker.addTo(map) : map.removeLayer(item.marker);
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    if (!list) return;
    
    // On vide et on reconstruit proprement
    let html = `<div class="filter-section"><div class="section-title">Statuts</div><div class="filters-grid">`;
    Object.entries(CONFIG.status).forEach(([key, cfg]) => {
        const count = markersStore.filter(m => m.status === key).length;
        html += `
            <div class="filter-item color-filter ${cfg.checked ? 'active' : ''}" onclick="toggleStatus('${key}')">
                <div class="filter-dot" style="background:${cfg.color}"></div>
                <div class="filter-content"><span class="filter-label">${cfg.label}</span><span class="filter-description">${count} sites</span></div>
                <div class="filter-checkbox"></div>
            </div>`;
    });
    html += `</div></div><div class="filters-divider"></div><div class="filter-section"><div class="section-title">TMS</div><div class="filters-grid">`;
    Object.entries(CONFIG.tms.filters).forEach(([key, cfg]) => {
        html += `
            <div class="filter-item toggle-filter ${cfg.checked ? 'active' : ''}" onclick="toggleTms('${key}')">
                <div class="filter-content"><span class="filter-label">${cfg.label}</span><span class="filter-description">${cfg.location}</span></div>
                <span class="tms-badge">${cfg.count}</span><div class="toggle-switch"></div>
            </div>`;
    });
    html += `</div></div>`;
    list.innerHTML = html;
    document.getElementById('site-count').innerText = markersStore.filter(m => map.hasLayer(m.marker)).length;
}

// Les fonctions globales pour les clics
window.toggleStatus = (k) => { CONFIG.status[k].checked = !CONFIG.status[k].checked; markersStore.forEach(applyVisibility); renderFilters(); };
window.toggleTms = (k) => { 
    CONFIG.tms.filters[k].checked = !CONFIG.tms.filters[k].checked; 
    CONFIG.tms.isActive = Object.values(CONFIG.tms.filters).some(f => f.checked);
    markersStore.forEach(applyVisibility); renderFilters(); 
};

// --- RECHERCHE ---
async function fetchSug(q) {
    const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&type=municipality&limit=5`);
    const d = await r.json();
    suggestionBox.innerHTML = d.features.map(f => `
        <div class="suggestion-item" onclick="goLoc(${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]}, '${f.properties.city.replace(/'/g, "\\'")}')">
            <strong>${f.properties.city}</strong> (${f.properties.postcode})
        </div>`).join('');
}
window.goLoc = (lat, lon, city) => { searchInput.value = city; suggestionBox.innerHTML = ''; map.flyTo([lat, lon], 12); };
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    if (e.target.value.length < 2) { suggestionBox.innerHTML = ''; return; }
    debounceTimer = setTimeout(() => fetchSug(e.target.value), 300);
});

// --- MENU ---
document.addEventListener('DOMContentLoaded', () => {
    startApp();
    const btn = document.getElementById('menu-btn');
    // On cible la classe car ton HTML Bento utilise souvent .bento-filters
    const menu = document.querySelector('.bento-filters'); 
    
    btn?.addEventListener('click', () => {
        btn.classList.toggle('active');
        menu?.classList.toggle('open');
    });
});
