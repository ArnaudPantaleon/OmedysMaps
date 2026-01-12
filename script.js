const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "En sourcing": { color: "#f1c40f", label: "Sourcing", checked: false },
    "Inactives": { color: "#95a5a6", label: "Inactives", checked: false },
    "Fermees ou refus OTT": { color: "#e74c3c", label: "Fermés / Refus", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher ESMS", checked: false }
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
        const sData = resSalles[0]?.data || resSalles.data || [];
        const cData = resCabinets[0]?.data || resCabinets.data || [];
        creerMarqueurs([...sData, ...cData]);
    } catch (err) { console.error("Erreur", err); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(item.Latitude), lng = parseFloat(item.Longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const status = (item.Statut || "").trim();
        const typeRaw = (item.Type || "").trim();
        const isCabinet = typeRaw.toUpperCase() === "CABINET";
        const isESMS = typeRaw.toUpperCase().includes("ESMS") || typeRaw.toUpperCase().includes("EHPAD");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };

        const marker = L.circleMarker([lat, lng], {
            radius: isCabinet ? 10 : 7,
            fillColor: config.color, color: "#fff", weight: 2, fillOpacity: 0.9
        });

        if (config.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) marker.addTo(map);

        const phone = item.Phone || item.Telephone || "";
        const att = item.ATT || item.Att || "";
        const tms = item.TMS || item.Tms || "";

        // --- DESIGN AÉRÉ ET RÉORGANISÉ ---
        let popupContent = `
            <div style="min-width:280px; font-family: 'Segoe UI', sans-serif; padding:12px; color:#1e293b;">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <span style="font-size:10px; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:1px;">${typeRaw}</span>
                    <span style="background:${config.color}; color:white; padding:4px 10px; border-radius:50px; font-size:10px; font-weight:800;">
                        ${status}
                    </span>
                </div>

                <div style="display:flex; align-items:baseline; gap:10px; margin-bottom:10px;">
                    <h4 style="margin:0; font-size:18px; font-weight:900; color:#0f172a;">${item.Name}</h4>
                    ${att ? `<span style="font-size:13px; color:#64748b; font-weight:500;">• ATT : ${att}</span>` : ''}
                </div>

                <div style="margin-bottom:20px; color:#64748b; font-size:13px; display:flex; align-items:start; gap:6px;">
                    <span style="flex-shrink:0;">📍</span>
                    <span>${item.Address || "Adresse non renseignée"}</span>
                </div>

                ${!isCabinet && tms ? `
                <div style="background:#f8fafc; padding:12px; border-radius:12px; margin-bottom:20px; border:1px solid #f1f5f9;">
                    <div style="font-size:10px; color:#94a3b8; font-weight:800; text-transform:uppercase; margin-bottom:4px;">Responsable TMS</div>
                    <div style="font-size:14px; font-weight:700; color:#334155;">${tms}</div>
                </div>
                ` : ''}

                ${phone ? `
                <a href="tel:${phone.replace(/\s/g, '')}" 
                   style="text-decoration:none; background:#009597; color:white; display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; border-radius:14px; font-weight:800; font-size:14px; box-shadow: 0 4px 15px rgba(0,149,151,0.25);">
                    <span>📞</span> Appeler le site
                </a>
                ` : ''}
            </div>`;

        marker.bindPopup(popupContent, {
            maxWidth: 320,
            className: 'custom-popup'
        });
        
        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

// ... (Le reste des fonctions renderFilters, toggleStatus, updateStats, rechercheEtZoom, toggleMenu reste identique)

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `
            <label class="filter-card" style="--status-color: ${s.color}">
                <input type="checkbox" ${s.checked ? 'checked' : ''} onchange="toggleStatus('${key}', this.checked)">
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
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    if(!q) return;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
        .then(r => r.json()).then(res => {
            if (res.features.length) {
                const [lon, lat] = res.features[0].geometry.coordinates;
                map.flyTo([lat, lon], 12);
            }
        });
}

function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }
chargerDonnees();
