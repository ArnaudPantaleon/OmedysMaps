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

function formatPhone(num) {
    if (!num) return "";
    let clean = String(num).replace(/\D/g, "");
    return clean.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

async function fetchN8N(url) {
    try {
        const response = await fetch(url);
        let text = await response.text();
        if (text.includes('=')) text = text.substring(text.indexOf('=') + 1).trim();
        if (text.endsWith(';')) text = text.slice(0, -1);
        text = text.replace(/,\s*([\]}])/g, '$1');
        const parsed = JSON.parse(text);
        
        // Extraction spécifique pour ta structure [ { "data": [...] } ]
        if (Array.isArray(parsed) && parsed[0] && parsed[0].data) return parsed[0].data;
        return Array.isArray(parsed) ? parsed : (parsed.data || []);
    } catch (e) { return []; }
}

async function chargerDonnees() {
    const [dataS, dataC] = await Promise.all([
        fetchN8N('salles.json'),
        fetchN8N('cabinet.json')
    ]);
    creerMarqueurs([...dataS, ...dataC]);
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(String(item.Latitude || "").replace(',', '.'));
        const lng = parseFloat(String(item.Longitude || "").replace(',', '.'));
        if (isNaN(lat)) return;

        const status = (item.Statut || "").trim();
        const typeRaw = (item.Type || "SITE").trim();
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const isCabinet = typeRaw.toUpperCase() === "CABINET";
        const isESMS = typeRaw.toUpperCase().includes("ESMS");

        // TA POPUP BENTO (INTOUCHÉE)
        let popupContent = `
            <div class="bento-card">
                <div class="bento-header">
                    <span class="bento-type">${typeRaw.toUpperCase()}</span>
                    <span class="bento-status" style="background:${config.color}">${status}</span>
                </div>
                <h3 class="bento-title">${item.Name || "Site"}</h3>
                <div class="bento-info-row">
                    <div class="info-block">
                        <span class="info-label">ATT</span>
                        <span class="info-value">${item.ATT || item.Att || "—"}</span>
                    </div>
                    ${(item.TMS || item.Tms) ? `<div class="info-block"><span class="info-label">TMS</span><span class="info-value">TMS ${item.TMS || item.Tms}</span></div>` : ''}
                </div>
                <div class="bento-address"><span>📍</span><span>${item.Address || ""}</span></div>
                ${(item.Phone || item.Telephone) ? `<a href="tel:${String(item.Phone || item.Telephone).replace(/\s/g, '')}" class="bento-call-btn"><span>📞</span><span>${formatPhone(item.Phone || item.Telephone)}</span></a>` : ''}
            </div>`;

        const marker = L.circleMarker([lat, lng], {
            radius: isCabinet ? 10 : 7,
            fillColor: config.color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        });

        // Logique d'affichage initiale
        const show = isESMS ? (config.checked && statusSettings["TYPE_ESMS"].checked) : config.checked;
        if (show) marker.addTo(map);

        marker.bindPopup(popupContent);
        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    if (!list) return;
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
        const conf = statusSettings[m.status] || { checked: true };
        const show = m.isESMS ? (conf.checked && statusSettings["TYPE_ESMS"].checked) : conf.checked;
        if (show) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    const count = allMarkers.filter(m => map.hasLayer(m.marker)).length;
    if (document.getElementById('site-count')) document.getElementById('site-count').innerText = count;
}

function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`).then(r => r.json()).then(res => {
        if (res.features && res.features.length) {
            const [lon, lat] = res.features[0].geometry.coordinates;
            map.flyTo([lat, lon], 12);
        }
    });
}

chargerDonnees();
