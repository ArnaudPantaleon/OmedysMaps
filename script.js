// === CONFIG INITIALE PRÉSERVÉE ===
const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinets Omedys", checked: true },
        "Ouvertes": { color: "#3498db", label: "Salles Ouvertes", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecretariat", checked: true },
        "Ouverture en cours": { color: "#2ecc71", label: "En cours d'ouverture", checked: false }
    },
    tms: {
        isActive: false,
        filters: {
            "TMS 10": { label: "TMS 10", location: "Aube", count: 0, checked: false },
            "TMS 11": { label: "TMS 11", location: "Aude", count: 0, checked: false },
            "TMS 14": { label: "TMS 14", location: "Calvados", count: 0, checked: false },
            "TMS 18": { label: "TMS 18", location: "Cher", count: 0, checked: false },
            "TMS 21": { label: "TMS 21", location: "Côte-d'Or", count: 0, checked: false },
            "TMS 26": { label: "TMS 26", location: "Drôme", count: 0, checked: false },
            "TMS 28": { label: "TMS 28", location: "Eure-et-Loir", count: 0, checked: false },
            "TMS 31": { label: "TMS 31", location: "Haute-Garonne", count: 0, checked: false },
            "TMS 41": { label: "TMS 41", location: "Loir-et-Cher", count: 0, checked: false },
            "TMS 54": { label: "TMS 54", location: "Meurthe-et-Moselle", count: 0, checked: false },
            "TMS 55": { label: "TMS 55", location: "Meuse", count: 0, checked: false },
            "TMS 59": { label: "TMS 59", location: "Nord", count: 0, checked: false },
            "TMS 72": { label: "TMS 72", location: "Sarthe", count: 0, checked: false },
            "TMS ESMS Emeis": { label: "TMS ESMS Emeis", location: "National", count: 0, checked: false }
        }
    },
    type: {
        ESMS: { label: "Afficher les ESMS", description: "EHPAD, Foyers, FAM...", count: 0, checked: true }
    }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markersStore = [];
let debounceTimer = null;

// === FONCTIONS UTILES ===
const formatPhone = (n) => {
    if(!n) return "N/C";
    let c = ('' + n).replace(/\D/g, '');
    if(c.startsWith('33')) c = '0' + c.slice(2);
    if(c.length === 9) c = '0' + c;
    return c.replace(/(\d{2})(?=\d)/g, '$1 ');
};

const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr).then(() => alert("Copié !"));
};

// === LOGIQUE DE FILTRAGE ===
function applyVisibility(entry) {
    const statusOk = CONFIG.status[entry.status]?.checked !== false;
    const tmsOk = !CONFIG.tms.isActive || entry.type === "CABINET" || (entry.tms && CONFIG.tms.filters[entry.tms]?.checked);
    const esmsOk = !entry.isESMS || CONFIG.type.ESMS.checked;
    
    if (statusOk && tmsOk && esmsOk) entry.marker.addTo(map);
    else map.removeLayer(entry.marker);
    updateStats();
}

// === ENGINE PRINCIPAL ===
async function startApp() {
    try {
        const index = await fetch('index.json').then(r => r.json());
        const datasets = await Promise.all(index.filter(f => f.visible).map(f => fetch(f.file).then(r => r.json())));
        const rawData = datasets.flatMap(d => d[0]?.data || []);

        rawData.forEach(item => {
            let loc = item.Location;
            if (typeof loc === 'string') try { loc = JSON.parse(loc); } catch(e) { return; }
            if (!loc || !loc.lat) return;

            const statut = item.Statut_Salle || item.Statut || "Ouvert";
            const isESMS = /ESMS|EHPAD|Foyer|FAM|MAS/i.test(item.Type || "");
            const tmsKey = item.TMS || "";
            const phone = item.Phone || item.ATT_Phone || item.Telephone || "";
            const color = CONFIG.status[statut]?.color || "#94a3b8";

            // Update Counters
            if(CONFIG.tms.filters[tmsKey]) CONFIG.tms.filters[tmsKey].count++;
            if(isESMS) CONFIG.type.ESMS.count++;

            // Marker Creation
            let marker;
            if (item.Type === "CABINET") {
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="width:36px;height:36px;background:var(--glass-bg);backdrop-filter:var(--glass-blur);border:2px solid var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--primary);box-shadow:var(--glass-shadow);"><i class="fa-solid fa-stethoscope"></i></div>`,
                    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
                });
                marker = L.marker([loc.lat, loc.lng], { icon });
            } else {
                marker = L.circleMarker([loc.lat, loc.lng], { radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9 });
            }

            // Popup Template (BP3)
            const popupContent = `
                <div class="bp3">
                    <div class="bp3-header">
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span class="bp3-tile-label" style="background:var(--primary); color:white; padding:2px 8px; border-radius:10px;">${item.Type || 'SITE'}</span>
                            <span style="font-size:10px; font-weight:800; color:${color}">${statut}</span>
                        </div>
                        <div class="bp3-title" style="font-weight:800; font-size:15px;">${item.Name || "Sans nom"}</div>
                    </div>
                    <div class="bp3-grid">
                        <div class="bp3-tile bp3-wide">
                            <span class="bp3-tile-label">Responsable</span>
                            <span class="bp3-tile-value">${item.ATT_Name || item.ATT || "Non assigné"}</span>
                        </div>
                        <div class="bp3-tile">
                            <span class="bp3-tile-label">Téléphone</span>
                            <a href="tel:${phone}" class="bp3-tile-value" style="color:var(--primary); text-decoration:none;">${formatPhone(phone)}</a>
                        </div>
                        ${item.MSS ? `<div class="bp3-tile"><span class="bp3-tile-label">MSS</span><span class="bp3-tile-value">${item.MSS}</span></div>` : ''}
                        <div class="bp3-tile bp3-wide">
                            <span class="bp3-tile-label">Adresse</span>
                            <span class="bp3-tile-value">${loc.address || "N/A"}</span>
                        </div>
                    </div>
                    <div style="padding:12px; display:flex; gap:8px;">
                        <button onclick="copyAddress('${(loc.address || "").replace(/'/g, "\\'")}')" style="flex:1; padding:8px; border-radius:8px; border:1px solid var(--glass-border); background:var(--glass-bg-inner); cursor:pointer;">Copier</button>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}" target="_blank" style="flex:1; text-align:center; padding:8px; border-radius:8px; background:var(--primary); color:white; text-decoration:none;">Maps</a>
                    </div>
                </div>`;

            marker.bindPopup(popupContent, { className: 'bp3-popup', maxWidth: 310 });
            
            const entry = { marker, status: statut, tms: tmsKey, isESMS, type: item.Type };
            markersStore.push(entry);
            applyVisibility(entry);
        });

        renderFilters();
    } catch (e) { console.error("Data Load Error", e); }
}

// === RENDER UI ===
function renderFilters() {
    const list = document.getElementById('filter-list');
    if(!list) return;

    let html = `
        <div style="margin-bottom:15px;">
            <small class="bp3-tile-label">Statuts</small>
            ${Object.entries(CONFIG.status).map(([k, v]) => `
                <div class="filter-item ${v.checked ? 'active' : ''}" onclick="toggleStatus('${k}')">
                    <div style="width:12px; height:12px; border-radius:50%; background:${v.color}"></div>
                    <div style="flex-grow:1; font-size:13px; font-weight:600;">${v.label}</div>
                    <div style="font-size:11px; opacity:0.6;">${markersStore.filter(m => m.status === k).length}</div>
                </div>
            `).join('')}
        </div>
        <div style="margin-bottom:15px;">
            <small class="bp3-tile-label">Centres TMS</small>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
                ${Object.entries(CONFIG.tms.filters).map(([k, v]) => `
                    <div class="filter-item ${v.checked ? 'active' : ''}" onclick="toggleTms('${k}')" style="padding:8px; flex-direction:column; align-items:flex-start; gap:2px;">
                        <div style="font-size:11px; font-weight:800;">${v.label}</div>
                        <div style="font-size:9px; opacity:0.5;">${v.location} (${v.count})</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div>
            <small class="bp3-tile-label">Établissements</small>
            <div class="filter-item ${CONFIG.type.ESMS.checked ? 'active' : ''}" onclick="toggleEsms()">
                <div style="flex-grow:1; font-size:13px; font-weight:600;">Afficher les ESMS</div>
                <div style="font-size:11px; opacity:0.6;">${CONFIG.type.ESMS.count}</div>
            </div>
        </div>
    `;
    list.innerHTML = html;
}

// === INTERACTION HANDLERS ===
window.toggleStatus = (k) => { CONFIG.status[k].checked = !CONFIG.status[k].checked; markersStore.forEach(applyVisibility); renderFilters(); };
window.toggleTms = (k) => { 
    CONFIG.tms.filters[k].checked = !CONFIG.tms.filters[k].checked;
    CONFIG.tms.isActive = Object.values(CONFIG.tms.filters).some(f => f.checked);
    markersStore.forEach(applyVisibility); renderFilters(); 
};
window.toggleEsms = () => { CONFIG.type.ESMS.checked = !CONFIG.type.ESMS.checked; markersStore.forEach(applyVisibility); renderFilters(); };

function updateStats() {
    const el = document.getElementById('site-count');
    if(el) el.innerText = markersStore.filter(m => map.hasLayer(m.marker)).length;
}

// === RECHERCHE API ADRESSE ===
const searchInput = document.getElementById('query');
const sugBox = document.getElementById('suggestions');

searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const q = e.target.value;
    if(q.length < 3) { sugBox.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&type=municipality&limit=5`);
        const d = await r.json();
        sugBox.innerHTML = d.features.map(f => `
            <div class="suggestion-item" onclick="flyToCity(${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]}, '${f.properties.city}')">
                <strong>${f.properties.city}</strong> <small>(${f.properties.postcode})</small>
            </div>
        `).join('');
    }, 300);
});

window.flyToCity = (lat, lon, name) => {
    map.flyTo([lat, lon], 12);
    searchInput.value = name;
    sugBox.innerHTML = '';
};

// === INITIALISATION UI ===
document.addEventListener('DOMContentLoaded', () => {
    startApp();
    const btn = document.getElementById('menu-btn');
    const panel = document.getElementById('filter-list');
    btn?.addEventListener('click', () => {
        panel?.classList.toggle('open');
        btn.classList.toggle('active');
    });
});
