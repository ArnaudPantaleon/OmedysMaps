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
        // Gestion du format [ { data: [...] } ]
        const dataSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : [];
        const dataCabinets = (resCabinets[0] && resCabinets[0].data) ? resCabinets[0].data : [];
        
        creerMarqueurs([...dataSalles, ...dataCabinets]);
    } catch (err) { 
        console.error("Erreur chargement JSON:", err); 
    }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        // SÉCURITÉ : Vérification des coordonnées (insensible à la casse)
        const lat = parseFloat(item.Latitude || item.latitude);
        const lng = parseFloat(item.Longitude || item.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            console.warn("Coordonnées invalides pour:", item.Name);
            return; // Saute cet item au lieu de faire planter le script
        }

        const status = (item.Statut || "Inconnu").trim();
        const typeRaw = (item.Type || "").trim();
        const typeUpper = typeRaw.toUpperCase();
        
        const isESMS = typeUpper.includes("ESMS") || typeUpper.includes("EHPAD") || typeUpper.includes("FOYER");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const color = config.color;

        const marker = L.circleMarker([lat, lng], {
            radius: typeUpper === "CABINET" ? 10 : 7,
            fillColor: color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        });

        // Logique d'affichage
        const visibleInitiale = config.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked);
        if (visibleInitiale) marker.addTo(map);

        // --- CONSTRUCTION DU POPUP ---
        const tmsHtml = typeUpper !== "CABINET" ? `
            <div style="flex: 1; min-width: 0;">
                <span style="font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold; display: block;">TMS</span>
                <span style="font-size: 11px; color: #2d3748; font-weight: 600; white-space: nowrap; display: block; overflow: hidden; text-overflow: ellipsis;">${item.TMS || "—"}</span>
            </div>` : '';

        let telBtn = "";
        if (item.Phone) {
            const clean = item.Phone.toString().replace(/\D/g, '');
            telBtn = `<a href="tel:${clean}" style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; padding: 10px; background: #f0fdfa; color: #009597; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 14px; border: 1px solid #ccfbf1;">📞 Appeler</a>`;
        }

        marker.bindPopup(`
            <div style="min-width:250px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="background: #edf2f7; color: #4a5568; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase;">${typeRaw}</span>
                    <span style="color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; background:${color}">${status}</span>
                </div>
                <b style="color:#009597; font-size:15px; display:block; margin-bottom:4px;">${item.Name}</b>
                <div style="color: #718096; font-size: 11px; margin: 8px 0;">📍 ${item.Address || ""}</div>
                <div style="display: flex; gap: 15px; border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 10px;">
                    <div style="flex: 1; min-width: 0;">
                        <span style="font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold; display: block;">ATT</span>
                        <span style="font-size: 11px; color: #2d3748; font-weight: 600; white-space: nowrap; display: block; overflow: hidden; text-overflow: ellipsis;">${item.ATT || "—"}</span>
                    </div>
                    ${tmsHtml}
                </div>
                ${telBtn}
            </div>
        `);

        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    if (!list) return;
    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `
            <label class="filter-item ${s.special ? 'special-case' : ''}">
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
        statsDiv.innerHTML = `<span id="site-count">0</span><span class="stats-label">Sites visibles</span>`;
        sideMenu.appendChild(statsDiv);
    }
    updateStats();
}

window.toggleStatus = (name, isChecked) => {
    if (statusSettings[name]) statusSettings[name].checked = isChecked;
    allMarkers.forEach(m => {
        const isStatusOn = statusSettings[m.status]?.checked;
        const isEsmsGlobalOn = statusSettings["TYPE_ESMS"].checked;
        const visible = m.isESMS ? (isStatusOn && isEsmsGlobalOn) : isStatusOn;
        if (visible) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    const count = allMarkers.filter(m => map.hasLayer(m.marker)).length;
    document.getElementById('site-count').innerText = count;
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
        .then(r => r.json())
        .then(json => {
            if (json.features.length) {
                const [lon, lat] = json.features[0].geometry.coordinates;
                map.flyTo([lat, lon], 12);
            }
        });
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

chargerDonnees();
