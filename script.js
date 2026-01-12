const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true, special: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat OMEDYS", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "En sourcing": { color: "#f1c40f", label: "En sourcing", checked: false },
    "Inactives": { color: "#95a5a6", label: "Inactives", checked: false },
    "Fermees ou refus OTT": { color: "#e74c3c", label: "Fermé / Refus", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher les ESMS", checked: false }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let allMarkers = [];

async function chargerDonnees() {
    try {
        const [resSalles, resCabinets] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        const data = [...(resSalles[0]?.data || []), ...(resCabinets[0]?.data || [])];
        creerMarqueurs(data);
    } catch (err) { console.error("Erreur chargement:", err); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(item.Latitude || item.latitude);
        const lng = parseFloat(item.Longitude || item.longitude);

        if (isNaN(lat) || isNaN(lng)) return; // Sécurité anti-crash

        const status = (item.Statut || "Inconnu").trim();
        const type = (item.Type || "").trim().toUpperCase();
        const isESMS = type.includes("ESMS") || type.includes("EHPAD");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };

        const marker = L.circleMarker([lat, lng], {
            radius: type === "CABINET" ? 10 : 7,
            fillColor: config.color, color: "#fff", weight: 2, fillOpacity: 0.9
        });

        if (config.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) {
            marker.addTo(map);
        }

        // --- POPUP ---
        const tmsHtml = type !== "CABINET" ? `<div style="flex:1;"><span style="font-size:10px;color:#a0aec0;font-weight:bold;display:block;">TMS</span><span style="font-size:11px;color:#2d3748;font-weight:600;white-space:nowrap;">${item.TMS || "—"}</span></div>` : '';
        
        marker.bindPopup(`
            <div style="min-width:230px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span style="background:#edf2f7;color:#4a5568;padding:2px 6px;border-radius:4px;font-size:9px;font-weight:800;">${type}</span>
                    <span style="color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:bold;background:${config.color}">${status}</span>
                </div>
                <b style="color:#009597;font-size:14px;display:block;">${item.Name}</b>
                <div style="margin:8px 0;font-size:11px;color:#718096;">📍 ${item.Address || "—"}</div>
                <div style="display:flex;gap:15px;border-top:1px dashed #e2e8f0;padding-top:10px;">
                    <div style="flex:1;"><span style="font-size:10px;color:#a0aec0;font-weight:bold;display:block;">ATT</span><span style="font-size:11px;color:#2d3748;font-weight:600;white-space:nowrap;">${item.ATT || "—"}</span></div>
                    ${tmsHtml}
                </div>
            </div>
        `);

        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.className = "filter-list-container";
    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `<label class="filter-item ${s.special ? 'special-case' : ''}">
            <input type="checkbox" ${s.checked ? 'checked' : ''} onclick="toggleStatus('${key}', this.checked)">
            <span class="dot" style="background:${s.color}"></span>
            <span class="filter-label">${s.label}</span>
        </label>`;
    }).join('');

    if (!document.getElementById('stats-block')) {
        const sideMenu = document.getElementById('side-menu');
        const statsDiv = document.createElement('div');
        statsDiv.id = 'stats-block';
        statsDiv.className = 'stats-block';
        statsDiv.innerHTML = `<div class="stats-header">📊 <span id="site-count">0</span> sites affichés</div><div class="stats-hint">Le décompte s'ajuste automatiquement selon vos filtres.</div>`;
        sideMenu.appendChild(statsDiv);
    }
    updateStats();
}

window.toggleStatus = (name, isChecked) => {
    statusSettings[name].checked = isChecked;
    allMarkers.forEach(m => {
        const isStatusOn = statusSettings[m.status].checked;
        const isEsmsOn = statusSettings["TYPE_ESMS"].checked;
        const visible = m.isESMS ? (isStatusOn && isEsmsOn) : isStatusOn;
        if (visible) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
        .then(r => r.json()).then(res => {
            if (res.features.length) {
                const [lon, lat] = res.features[0].geometry.coordinates;
                map.flyTo([lat, lon], 12);
            }
        });
}

function toggleMenu() {
    const menu = document.getElementById('side-menu');
    menu.classList.toggle('open');
}

chargerDonnees();
