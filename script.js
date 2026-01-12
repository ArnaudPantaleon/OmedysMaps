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

// Initialisation de la carte avec correction de taille immédiate
let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Correction bug tuiles grises
setTimeout(() => { map.invalidateSize(); }, 500);

let allMarkers = [];

async function chargerDonnees() {
    try {
        console.log("Tentative de chargement des fichiers JSON...");
        const [resSalles, resCabinets] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        
        // Extraction sécurisée pour format GitHub [ { "data": [...] } ]
        const dataSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : (resSalles.data || []);
        const dataCabinets = (resCabinets[0] && resCabinets[0].data) ? resCabinets[0].data : (resCabinets.data || []);
        
        const combiné = [...dataSalles, ...dataCabinets];
        console.log("Données chargées avec succès :", combiné.length, "sites trouvés.");
        
        creerMarqueurs(combiné);
    } catch (err) {
        console.error("ERREUR D'AFFICHAGE (JSON mal formé ou absent) :", err);
    }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const status = (item.Statut || "Inconnu").trim();
        const typeRaw = (item.Type || "").trim();
        const typeUpper = typeRaw.toUpperCase();
        const isESMS = typeUpper.includes("ESMS") || typeUpper.includes("EHPAD");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const color = config.color;

        const marker = L.circleMarker([lat, lng], {
            radius: typeUpper === "CABINET" ? 10 : 7,
            fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9
        });

        if (config.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) {
            marker.addTo(map);
        }

        // DESIGN POPUP RÉFÉRENCE + TÉLÉPHONE
        const phoneRaw = item.Phone || item.Telephone || "";
        const phoneHtml = phoneRaw ? `
            <div style="margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
                <a href="tel:${phoneRaw.replace(/\s/g, '')}" 
                   style="text-decoration: none; background: #f0fdfa; color: #009597; border: 1px solid #ccfbf1; 
                          padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; 
                          gap: 10px; font-weight: 700; font-size: 13px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    ${phoneRaw}
                </a>
            </div>` : '';

        const tmsHtml = typeUpper !== "CABINET" ? `
            <div style="flex: 1;">
                <span style="font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold; display: block;">TMS</span>
                <span style="font-size: 11px; color: #2d3748; font-weight: 600;">${item.TMS || "—"}</span>
            </div>` : '';

        marker.bindPopup(`
            <div style="min-width:250px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="background: #edf2f7; color: #4a5568; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800;">${typeRaw}</span>
                    <span style="color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; background:${color}">${status}</span>
                </div>
                <b style="color:#009597; font-size:15px; display:block; margin-bottom:4px;">${item.Name}</b>
                <div style="color: #718096; font-size: 11px; margin: 8px 0;">📍 ${item.Address || "—"}</div>
                <div style="display: flex; gap: 15px; border-top: 1px dashed #e2e8f0; padding-top: 10px; margin-top: 10px;">
                    <div style="flex: 1;">
                        <span style="font-size: 10px; color: #a0aec0; font-weight: bold; display: block;">ATT</span>
                        <span style="font-size: 11px; color: #2d3748; font-weight: 600;">${item.ATT || "—"}</span>
                    </div>
                    ${tmsHtml}
                </div>
                ${phoneHtml}
            </div>
        `);

        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `<label class="filter-card">
            <input type="checkbox" ${s.checked ? 'checked' : ''} onclick="toggleStatus('${key}', this.checked)">
            <span class="dot" style="background:${s.color}"></span>
            <span class="label">${s.label}</span>
        </label>`;
    }).join('');
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
    const active = allMarkers.filter(m => map.hasLayer(m.marker)).length;
    document.getElementById('site-count').innerText = active;
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

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

chargerDonnees();
