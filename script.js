// === CONFIGURATION GLOBALE ===
const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinets Omedys", icon: "fa-house-medical", checked: true },
        "Ouvertes": { color: "#3498db", label: "Salles Ouvertes", icon: "fa-door-open", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecretariat", icon: "fa-headset", checked: true },
        "Ouverture en cours": { color: "#2ecc71", label: "En cours", icon: "fa-clock", checked: false }
    },
    tms: {
        isActive: false,
        filters: {
            "TMS 10": { label: "TMS 10", location: "Aube", count: 0, checked: false },
            "TMS 11": { label: "TMS 11", location: "Aude", count: 0, checked: false },
            "TMS 14": { label: "TMS 14", location: "Caen", count: 0, checked: false },
            "TMS 18": { label: "TMS 18", location: "Cher", count: 0, checked: false },
            "TMS 21": { label: "TMS 21", location: "Dijon", count: 0, checked: false },
            "TMS 26": { label: "TMS 26", location: "Drôme", count: 0, checked: false },
            "TMS 28": { label: "TMS 28", location: "Eure-et-Loir", count: 0, checked: false },
            "TMS 31": { label: "TMS 31", location: "Toulouse", count: 0, checked: false },
            "TMS 41": { label: "TMS 41", location: "Blois", count: 0, checked: false },
            "TMS 54": { label: "TMS 54", location: "Nancy", count: 0, checked: false },
            "TMS 55": { label: "TMS 55", location: "Verdun", count: 0, checked: false },
            "TMS 59": { label: "TMS 59", location: "Lille", count: 0, checked: false },
            "TMS 72": { label: "TMS 72", location: "Le Mans", count: 0, checked: false },
            "TMS ESMS Emeis": { label: "Emeis", location: "National", count: 0, checked: false }
        }
    },
    type: {
        ESMS: { label: "Afficher ESMS", count: 0, checked: true }
    }
};

// === INITIALISATION ===
let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markersStore = [];
let debounceTimer = null;

const formatPhone = (n) => {
    if(!n) return "N/C";
    let c = ('' + n).replace(/\D/g, '');
    if(c.startsWith('33')) c = '0' + c.slice(2);
    if(c.length === 9) c = '0' + c;
    return c.replace(/(\d{2})(?=\d)/g, '$1 ');
};

// === CORE APP ===
async function startApp() {
    try {
        const index = await fetch('index.json').then(r => r.json());
        const datasets = await Promise.all(index.filter(f => f.visible).map(f => fetch(f.file).then(r => r.json())));
        const rawData = datasets.flatMap(d => d[0]?.data || []);

        rawData.forEach(item => {
            let loc = typeof item.Location === 'string' ? JSON.parse(item.Location) : item.Location;
            if(!loc || !loc.lat) return;

            const statut = item.Statut_Salle || item.Statut || "Ouvert";
            const tmsKey = item.TMS || "";
            const isESMS = /ESMS|EHPAD|Foyer|FAM|MAS/i.test(item.Type || "");
            const phone = item.Phone || item.ATT_Phone || item.Telephone || "";
            const color = CONFIG.status[statut]?.color || "#94a3b8";

            // Counters
            if(CONFIG.tms.filters[tmsKey]) CONFIG.tms.filters[tmsKey].count++;
            if(isESMS) CONFIG.type.ESMS.count++;

            // Marker Design
            let marker;
            if (item.Type === "CABINET") {
                marker = L.marker([loc.lat, loc.lng], {
                    icon: L.divIcon({
                        className: '',
                        html: `<div style="width:40px;height:40px;background:var(--glass-bg);backdrop-filter:var(--glass-blur);border:2px solid var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--primary);box-shadow:var(--shadow);"><i class="fa-solid fa-stethoscope"></i></div>`,
                        iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
                    })
                });
            } else {
                marker = L.circleMarker([loc.lat, loc.lng], { radius: 8, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9 });
            }

            // Popup BP3
            const popupContent = `
                <div class="bp3-card">
                    <div class="bp3-header">
                        <span class="bp3-badge">${item.Type || 'SITE'}</span>
                        <div class="bp3-title">${item.Name || "Sans nom"}</div>
                    </div>
                    <div class="bp3-grid">
                        <div class="bp3-info bp3-full">
                            <i class="fa-solid fa-user-tie"></i>
                            <span class="bp3-label">Responsable / ATT</span>
                            <span class="bp3-value">${item.ATT_Name || item.ATT || "Non assigné"}</span>
                        </div>
                        <div class="bp3-info">
                            <i class="fa-solid fa-phone"></i>
                            <span class="bp3-label">Contact</span>
                            <a href="tel:${phone}" style="text-decoration:none; color:inherit;" class="bp3-value">${formatPhone(phone)}</a>
                        </div>
                        <div class="bp3-info">
                            <i class="fa-solid fa-network-wired"></i>
                            <span class="bp3-label">Centre TMS</span>
                            <span class="bp3-value">${tmsKey || "Standard"}</span>
                        </div>
                        ${item.MSS ? `
                        <div class="bp3-info bp3-full">
                            <i class="fa-solid fa-envelope-shield"></i>
                            <span class="bp3-label">Messagerie MSS</span>
                            <span class="bp3-value" style="font-size:11px;">${item.MSS}</span>
                        </div>` : ''}
                        <div class="bp3-info bp3-full">
                            <i class="fa-solid fa-location-dot"></i>
                            <span class="bp3-label">Adresse</span>
                            <span class="bp3-value">${loc.address || "N/A"}</span>
                        </div>
                    </div>
                    <div class="bp3-footer">
                        <button class="bp3-btn btn-copy" onclick="copyAddr('${(loc.address || "").replace(/'/g, "\\'")}')"><i class="fa-solid fa-copy"></i> Copier</button>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}" target="_blank" class="bp3-btn btn-maps"><i class="fa-solid fa-route"></i> Maps</a>
                    </div>
                </div>`;

            marker.bindPopup(popupContent, { className: 'bp3-popup', maxWidth: 320 });
            
            const entry = { marker, status: statut, tms: tmsKey, isESMS, type: item.Type };
            markersStore.push(entry);
            applyFilter(entry);
        });

        renderFilters();
    } catch (e) { console.error("Erreur Expertise Data:", e); }
}

// === LOGIQUE DE FILTRE ===
function applyFilter(entry) {
    const statusMatch = CONFIG.status[entry.status]?.checked;
    const tmsMatch = !CONFIG.tms.isActive || entry.type === "CABINET" || (entry.tms && CONFIG.tms.filters[entry.tms]?.checked);
    const esmsMatch = !entry.isESMS || CONFIG.type.ESMS.checked;

    if (statusMatch && tmsMatch && esmsMatch) entry.marker.addTo(map);
    else map.removeLayer(entry.marker);
    updateSiteCount();
}

function updateSiteCount() {
    const count = markersStore.filter(m => map.hasLayer(m.marker)).length;
    document.getElementById('site-count').innerText = count;
}

// === RENDER UI FILTRES ===
function renderFilters() {
    const container = document.getElementById('filter-list');
    if(!container) return;

    let html = `<div class="filter-section-title">Statuts de déploiement</div>`;
    Object.entries(CONFIG.status).forEach(([id, cfg]) => {
        html += `
            <div class="filter-item ${cfg.checked ? 'active' : ''}" onclick="toggleStatus('${id}')">
                <i class="fa-solid ${cfg.icon}" style="color:${cfg.color}"></i>
                <span style="flex:1; font-weight:700;">${cfg.label}</span>
                <span style="font-size:11px; opacity:0.6;">${markersStore.filter(m => m.status === id).length}</span>
            </div>`;
    });

    html += `<div class="filter-section-title">Centres TMS</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">`;
    Object.entries(CONFIG.tms.filters).forEach(([id, cfg]) => {
        html += `
            <div class="filter-item ${cfg.checked ? 'active' : ''}" onclick="toggleTms('${id}')" style="flex-direction:column; align-items:flex-start; padding:10px;">
                <span style="font-size:12px; font-weight:800;">${cfg.label}</span>
                <span style="font-size:9px; opacity:0.7;">${cfg.location} (${cfg.count})</span>
            </div>`;
    });
    html += `</div>`;

    html += `<div class="filter-section-title">Établissements</div>`;
    html += `
        <div class="filter-item ${CONFIG.type.ESMS.checked ? 'active' : ''}" onclick="toggleEsms()">
            <i class="fa-solid fa-hospital-user"></i>
            <span style="flex:1; font-weight:700;">Afficher les ESMS</span>
            <span style="font-size:11px; opacity:0.6;">${CONFIG.type.ESMS.count}</span>
        </div>`;

    container.innerHTML = html;
}

// === HANDLERS GLOBAUX ===
window.toggleStatus = (id) => { CONFIG.status[id].checked = !CONFIG.status[id].checked; markersStore.forEach(applyFilter); renderFilters(); };
window.toggleTms = (id) => { 
    CONFIG.tms.filters[id].checked = !CONFIG.tms.filters[id].checked;
    CONFIG.tms.isActive = Object.values(CONFIG.tms.filters).some(f => f.checked);
    markersStore.forEach(applyFilter); renderFilters(); 
};
window.toggleEsms = () => { CONFIG.type.ESMS.checked = !CONFIG.type.ESMS.checked; markersStore.forEach(applyFilter); renderFilters(); };
window.copyAddr = (a) => { navigator.clipboard.writeText(a); alert("Adresse copiée !"); };

// === RECHERCHE API ===
const searchInput = document.getElementById('query');
const sugBox = document.getElementById('suggestions');

searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value;
    if(q.length < 3) { sugBox.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&type=municipality&limit=5`);
        const d = await r.json();
        sugBox.innerHTML = `<div class="bento-tile" style="padding:5px;">` + d.features.map(f => `
            <div class="filter-item" onclick="flyToCity(${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]}, '${f.properties.city.replace(/'/g, "\\'")}')">
                <i class="fa-solid fa-location-dot"></i>
                <div><strong>${f.properties.city}</strong> <small>(${f.properties.postcode})</small></div>
            </div>`).join('') + `</div>`;
    }, 300);
});

window.flyToCity = (lat, lon, name) => {
    map.flyTo([lat, lon], 12);
    searchInput.value = name;
    sugBox.innerHTML = '';
};

// === INIT UI ===
document.addEventListener('DOMContentLoaded', () => {
    startApp();
    const btn = document.getElementById('menu-btn');
    const panel = document.getElementById('filter-list');
    btn.onclick = () => {
        panel.classList.toggle('open');
        btn.classList.toggle('active');
    };
});
