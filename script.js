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
        const [resS, resC] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        creerMarqueurs([...(resS.data || resS[0]?.data || []), ...(resC.data || resC[0]?.data || [])]);
    } catch (e) { console.error("Erreur chargement", e); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(item.Latitude), lng = parseFloat(item.Longitude);
        if (isNaN(lat)) return;

        const status = (item.Statut || "").trim();
        const type = (item.Type || "").trim();
        const isCab = type.toUpperCase() === "CABINET";
        const conf = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const att = item.ATT || item.Att || "";
        const tms = item.TMS || item.Tms || "";
        const tel = item.Phone || item.Telephone || "";

        let popupHtml = `
            <div class="custom-popup-box">
                <div class="popup-header">
                    <span class="type-lbl">${type}</span>
                    <span class="status-tag" style="background:${conf.color}">${status}</span>
                </div>
                <div class="title-section">
                    <h4 class="site-name">${item.Name}</h4>
                    ${att ? `<span class="att-info">• ATT : ${att}</span>` : ''}
                </div>
                <div class="addr-section">
                    <span>📍</span><span>${item.Address || ""}</span>
                </div>
                ${!isCab && tms ? `
                    <div class="tms-pill">
                        <span class="tms-lit">TMS</span>
                        <span class="tms-val">${tms}</span>
                    </div>
                ` : ''}
                ${tel ? `
                    <a href="tel:${tel.replace(/\s/g, '')}" class="call-btn">
                        <span>📞</span> Appeler le site
                    </a>
                ` : ''}
            </div>`;

        const m = L.circleMarker([lat, lng], {
            radius: isCab ? 10 : 7, fillColor: conf.color, color: "#fff", weight: 2, fillOpacity: 0.9
        });

        if (conf.checked) m.addTo(map);
        m.bindPopup(popupHtml);
        allMarkers.push({ marker: m, status, isESMS: type.toUpperCase().includes("ESMS") });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(k => `
        <label class="filter-card" style="--status-color: ${statusSettings[k].color}">
            <input type="checkbox" ${statusSettings[k].checked ? 'checked' : ''} onchange="toggleStatus('${k}', this.checked)">
            <span class="dot"></span><span class="label">${statusSettings[k].label}</span>
        </label>`).join('');
    updateStats();
}

window.toggleStatus = (n, c) => {
    statusSettings[n].checked = c;
    allMarkers.forEach(m => {
        const show = m.isESMS ? (statusSettings[m.status].checked && statusSettings["TYPE_ESMS"].checked) : statusSettings[m.status].checked;
        if (show) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() { document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length; }

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
