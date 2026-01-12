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

        // --- CONSTRUCTION DE LA POPUP AVEC TYPE ET STATUT ---
        let popupContent = `
            <div style="min-width:230px; font-family: 'Segoe UI', sans-serif; padding:5px;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                    <div>
                        <h4 style="margin:0; color:#009597; font-size:15px; font-weight:800; line-height:1.2;">${item.Name}</h4>
                        <span style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">${typeRaw}</span>
                    </div>
                    <span style="background:${config.color}20; color:${config.color}; padding:3px 8px; border-radius:6px; font-size:10px; font-weight:800; border:1px solid ${config.color}40;">
                        ${status}
                    </span>
                </div>
                
                <p style="margin:0 0 12px 0; color:#64748b; font-size:12px; line-height:1.4;">${item.Address || "Adresse non disponible"}</p>`;

        // ATT et TMS
        if (att || tms) {
            popupContent += `<div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:12px;">`;
            if (att) popupContent += `<span style="background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700; border:1px solid #e2e8f0;">ATT: ${att}</span>`;
            if (!isCabinet && tms) popupContent += `<span style="background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:700; border:1px solid #e2e8f0;">TMS: ${tms}</span>`;
            popupContent += `</div>`;
        }

        if (phone) {
            popupContent += `
                <div style="border-top:1px solid #f1f5f9; padding-top:12px; margin-top:5px;">
                    <a href="tel:${phone.replace(/\s/g, '')}" style="text-decoration:none; background:#f0fdfa; color:#009597; border:1px solid #ccfbf1; padding:10px; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:700; font-size:13px;">
                        📞 ${phone}
                    </a>
                </div>`;
        }
        popupContent += `</div>`;

        marker.bindPopup(popupContent);
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
