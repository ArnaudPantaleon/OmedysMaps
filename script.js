const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
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

setTimeout(() => map.invalidateSize(), 400);

let allMarkers = [];

async function chargerDonnees() {
    try {
        const [resSalles, resCabinets] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);

        const dataSalles = resSalles[0]?.data || [];
        const dataCabinets = resCabinets[0]?.data || [];
        const combined = [...dataSalles, ...dataCabinets];
        
        combined.forEach(item => {
            const lat = parseFloat(String(item.Latitude || item.Lat || "").replace(',', '.'));
            const lng = parseFloat(String(item.Longitude || item.Lng || "").replace(',', '.'));

            if (!isNaN(lat) && !isNaN(lng)) {
                const isESMS = ["EHPAD", "Foyer d'accueil", "FAM-MAS"].some(type => 
                    (item.Type || "").includes(type)
                );

                const marker = L.circleMarker([lat, lng], {
                    radius: item.Type === "CABINET" ? 10 : 7,
                    fillColor: statusSettings[item.Statut]?.color || "#95a5a6",
                    color: "#fff",
                    weight: 2,
                    fillOpacity: 0.9
                });

                const content = `
                    <div class="bento-popup">
                        <h3 style="margin:0; color:#009597; font-size:16px; font-weight:800;">${item.Name || item.Nom}</h3>
                        <div class="popup-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 0;">
                            <div style="background:#f1f5f9; padding:8px; border-radius:10px;">
                                <small style="font-size:8px; color:#64748b; font-weight:800; display:block;">ATT</small>
                                <span style="font-size:11px; font-weight:700;">${item.ATT || 'N/A'}</span>
                            </div>
                            <div style="background:#f1f5f9; padding:8px; border-radius:10px;">
                                <small style="font-size:8px; color:#64748b; font-weight:800; display:block;">TMS</small>
                                <span style="font-size:11px; font-weight:700;">${item.TMS || 'N/A'}</span>
                            </div>
                        </div>
                        <p style="font-size:11px; color:#475569; margin:0 0 12px 0;">📍 ${item.Address || item.Adresse}</p>
                        <a href="tel:${item.Phone || item.Tel}" style="display:block; text-align:center; background:#009597; color:white; padding:10px; border-radius:10px; text-decoration:none; font-weight:800; font-size:13px;">Appeler</a>
                    </div>`;

                marker.bindPopup(content);
                allMarkers.push({ marker, status: item.Statut, isESMS });
                
                if (statusSettings[item.Statut]?.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) {
                    marker.addTo(map);
                }
            }
        });
        genererFiltres();
    } catch (e) { console.error("Erreur", e); }
}

function genererFiltres() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(key => `
        <label class="filter-card">
            <input type="checkbox" ${statusSettings[key].checked ? 'checked' : ''} onchange="toggleStatus('${key}', this.checked)">
            <span class="dot" style="background:${statusSettings[key].color}"></span>
            <span class="label">${statusSettings[key].label}</span>
        </label>
    `).join('');
    updateStats();
}

window.toggleStatus = (name, isChecked) => {
    statusSettings[name].checked = isChecked;
    allMarkers.forEach(m => {
        const visible = m.isESMS ? (statusSettings[m.status].checked && statusSettings["TYPE_ESMS"].checked) : statusSettings[m.status].checked;
        if (visible) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

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

chargerDonnees();
