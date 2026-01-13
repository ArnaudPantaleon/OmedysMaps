const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "En cours": { color: "#3498db", label: "Ouverture en cours", checked: true },
    "En sourcing": { color: "#f1c40f", label: "En sourcing", checked: false },
    "Fermees ou refus OTT": { color: "#e74c3c", label: "Inactives", checked: false }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Fix affichage mobile
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
                const marker = L.circleMarker([lat, lng], {
                    radius: 9,
                    fillColor: statusSettings[item.Statut]?.color || "#95a5a6",
                    color: "#fff",
                    weight: 2,
                    fillOpacity: 0.9
                });

                const content = `
                    <div class="bento-popup">
                        <h3 style="margin:0; color:var(--primary); font-size:16px;">${item.Name || item.Nom}</h3>
                        <div class="popup-grid">
                            <div class="popup-tile"><span class="tile-label">RÉFÉRENT</span><span class="val">${item.ATT || 'N/A'}</span></div>
                            <div class="popup-tile"><span class="tile-label">CODE</span><span class="val">${item.TMS || 'N/A'}</span></div>
                        </div>
                        <p style="font-size:11px; margin-bottom:12px;">📍 ${item.Address || item.Adresse}</p>
                        <a href="tel:${item.Phone || item.Tel}" style="display:block; text-align:center; background:var(--primary); color:white; padding:10px; border-radius:10px; text-decoration:none; font-weight:800;">📞 Appeler</a>
                    </div>`;

                marker.bindPopup(content);
                allMarkers.push({ marker, status: item.Statut });
                
                if (statusSettings[item.Statut]?.checked) marker.addTo(map);
            }
        });

        genererFiltres();
    } catch (e) { console.error("Erreur de chargement", e); }
}

function genererFiltres() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(key => `
        <label class="filter-card">
            <input type="checkbox" ${statusSettings[key].checked ? 'checked' : ''} onchange="toggleStatus('${key}', this.checked)">
            <span class="dot" style="background:${statusSettings[key].color}"></span>
            <span class="label" style="font-size:12px; font-weight:600;">${statusSettings[key].label}</span>
        </label>
    `).join('');
    updateStats();
}

window.toggleStatus = (status, isChecked) => {
    statusSettings[status].checked = isChecked;
    allMarkers.forEach(m => {
        if (m.status === status) isChecked ? m.marker.addTo(map) : map.removeLayer(m.marker);
    });
    updateStats();
}

function updateStats() {
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

async function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`).then(res => res.json());
    if (r.features.length) {
        const [lon, lat] = r.features[0].geometry.coordinates;
        map.flyTo([lat, lon], 13);
    }
}

chargerDonnees();
