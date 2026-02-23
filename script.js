const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinets Omedys", icon: "fa-house-medical", checked: true },
        "Ouvertes": { color: "#3498db", label: "Salles Ouvertes", icon: "fa-door-open", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecretariat", icon: "fa-headset", checked: true },
        "Ouverture en cours": { color: "#2ecc71", label: "En cours", icon: "fa-clock", checked: false }
    },
    tms: { isActive: false, filters: {} }, // Dynamisé au chargement
    type: { ESMS: { label: "Établissements ESMS", count: 0, checked: true } }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markersStore = [];

// Formateur téléphone pro
const formatPhone = (n) => {
    if(!n) return "N/C";
    let c = ('' + n).replace(/\D/g, '');
    if(c.startsWith('33')) c = '0' + c.slice(2);
    if(c.length === 9) c = '0' + c;
    return c.replace(/(\d{2})(?=\d)/g, '$1 ');
};

async function startApp() {
    try {
        const index = await fetch('index.json').then(r => r.json());
        const datasets = await Promise.all(index.filter(f => f.visible).map(f => fetch(f.file).then(r => r.json())));
        const rawData = datasets.flatMap(d => d[0]?.data || []);

        rawData.forEach(item => {
            let loc = typeof item.Location === 'string' ? JSON.parse(item.Location) : item.Location;
            if(!loc || !loc.lat) return;

            const statut = item.Statut_Salle || item.Statut || "Ouvert";
            const color = CONFIG.status[statut]?.color || "#94a3b8";
            const isESMS = /ESMS|EHPAD|Foyer|FAM|MAS/i.test(item.Type || "");
            
            // Marker
            let marker;
            if (item.Type === "CABINET") {
                marker = L.marker([loc.lat, loc.lng], {
                    icon: L.divIcon({
                        className: '',
                        html: `<div style="width:36px;height:36px;background:var(--glass-bg);backdrop-filter:var(--glass-blur);border:2px solid var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--primary);box-shadow:0 4px 15px rgba(0,0,0,0.1);"><i class="fa-solid fa-stethoscope"></i></div>`,
                        iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -20]
                    })
                });
            } else {
                marker = L.circleMarker([loc.lat, loc.lng], { radius: 7, fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9 });
            }

            // Popup (Le coeur du design)
            const phone = item.Phone || item.ATT_Phone || item.Telephone || "";
            const popupContent = `
                <div class="bp3">
                    <div class="bp3-header">
                        <span class="bp3-tile-label" style="background:var(--primary); color:white; padding:2px 8px; border-radius:8px;">${item.Type || 'SITE'}</span>
                        <div class="bp3-title">${item.Name || "Sans nom"}</div>
                    </div>
                    <div class="bp3-grid">
                        <div class="bp3-tile bp3-wide">
                            <i class="fa-solid fa-user-doctor"></i>
                            <span class="bp3-tile-label">Responsable / ATT</span>
                            <span class="bp3-tile-value">${item.ATT_Name || item.ATT || "Non assigné"}</span>
                        </div>
                        <div class="bp3-tile">
                            <i class="fa-solid fa-phone"></i>
                            <span class="bp3-tile-label">Contact</span>
                            <a href="tel:${phone}" style="text-decoration:none; color:inherit;" class="bp3-tile-value">${formatPhone(phone)}</a>
                        </div>
                        <div class="bp3-tile">
                            <i class="fa-solid fa-microchip"></i>
                            <span class="bp3-tile-label">Centre TMS</span>
                            <span class="bp3-tile-value">${item.TMS || "N/A"}</span>
                        </div>
                        ${item.MSS ? `
                        <div class="bp3-tile bp3-wide">
                            <i class="fa-solid fa-envelope-shield"></i>
                            <span class="bp3-tile-label">Messagerie MSS</span>
                            <span class="bp3-tile-value" style="font-size:10px;">${item.MSS}</span>
                        </div>` : ''}
                        <div class="bp3-tile bp3-wide">
                            <i class="fa-solid fa-location-dot"></i>
                            <span class="bp3-tile-label">Adresse</span>
                            <span class="bp3-tile-value">${loc.address || "N/A"}</span>
                        </div>
                    </div>
                    <div class="bp3-footer">
                        <button class="bp3-btn bp3-btn--copy" onclick="navigator.clipboard.writeText('${(loc.address || "").replace(/'/g, "\\'")}')"><i class="fa-solid fa-copy"></i> Copier</button>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address)}" target="_blank" class="bp3-btn bp3-btn--maps"><i class="fa-solid fa-map-location-dot"></i> Maps</a>
                    </div>
                </div>`;

            marker.bindPopup(popupContent, { className: 'bp3-popup', maxWidth: 310 });
            
            const entry = { marker, status: statut, tms: item.TMS, isESMS, type: item.Type };
            markersStore.push(entry);
            if(CONFIG.status[statut]?.checked) marker.addTo(map);
        });

        renderFilters();
        updateStats();
    } catch (e) { console.error(e); }
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    if(!list) return;

    list.innerHTML = `
        <div style="margin-bottom:15px;">
            <p style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">Statuts de déploiement</p>
            ${Object.entries(CONFIG.status).map(([k, v]) => `
                <div class="filter-item ${v.checked ? 'active' : ''}" onclick="toggleStatus('${k}')">
                    <i class="fa-solid ${v.icon}" style="color:${v.color}"></i>
                    <span style="flex:1; font-weight:600; font-size:13px;">${v.label}</span>
                    <span style="opacity:0.5; font-size:11px;">${markersStore.filter(m => m.status === k).length}</span>
                </div>
            `).join('')}
        </div>
    `;
}

window.toggleStatus = (k) => {
    CONFIG.status[k].checked = !CONFIG.status[k].checked;
    markersStore.forEach(entry => {
        if(entry.status === k) {
            CONFIG.status[k].checked ? entry.marker.addTo(map) : map.removeLayer(entry.marker);
        }
    });
    renderFilters();
    updateStats();
};

function updateStats() {
    const el = document.getElementById('site-count');
    if(el) el.innerText = markersStore.filter(m => map.hasLayer(m.marker)).length;
}

// Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    startApp();
    const btn = document.getElementById('menu-btn');
    const panel = document.getElementById('filter-list');
    btn?.addEventListener('click', () => {
        panel.classList.toggle('open');
        btn.classList.toggle('active');
    });
});
