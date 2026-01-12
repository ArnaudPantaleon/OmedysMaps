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

const formatPhone = (n) => n ? String(n).replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim() : "";

async function chargerDonnees() {
    try {
        const fetchAndParse = async (url) => {
            const response = await fetch(url);
            let text = await response.text();
            // Nettoyage si le fichier contient "data ="
            if (text.includes('=')) text = text.split('=')[1].trim();
            if (text.endsWith(';')) text = text.slice(0, -1);
            return JSON.parse(text);
        };

        const resS = await fetchAndParse('salles.json');
        const resC = await fetchAndParse('cabinet.json');
        
        creerMarqueurs([...resS, ...resC]);
    } catch (e) { console.error("Erreur de données:", e); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(String(item.Latitude).replace(',', '.'));
        const lng = parseFloat(String(item.Longitude).replace(',', '.'));
        if (isNaN(lat)) return;

        const status = (item.Statut || "").trim();
        const type = (item.Type || "SITE").trim().toUpperCase();
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const isCabinet = type === "CABINET";

        const popupHtml = `
            <div class="bento-card">
                <div class="bento-header">
                    <span class="bento-type">${type}</span>
                    <span class="status-pill" style="background:${config.color}">${status}</span>
                </div>
                <h3 class="bento-title">${item.Name}</h3>
                <div class="bento-grid">
                    <div class="bento-item"><span class="item-label">ATT</span><span class="item-val">${item.ATT || "—"}</span></div>
                    ${item.TMS ? `<div class="bento-item"><span class="item-label">TMS</span><span class="item-val">${item.TMS}</span></div>` : ''}
                </div>
                <div class="bento-addr"><span>📍</span><span>${item.Address || ""}</span></div>
                ${(item.Phone || item.Telephone) ? `<a href="tel:${String(item.Phone || item.Telephone).replace(/\s/g, '')}" class="bento-call"><span>📞</span><span>${formatPhone(item.Phone || item.Telephone)}</span></a>` : ''}
            </div>`;

        const m = L.circleMarker([lat, lng], {
            radius: isCabinet ? 10 : 7, fillColor: config.color, color: "#fff", weight: 2, fillOpacity: 0.9,
            className: isCabinet ? 'pulse-marker' : ''
        });

        if (config.checked) m.addTo(map);
        m.bindPopup(popupHtml);
        allMarkers.push({ marker: m, status, isESMS: type.includes("ESMS") });
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
        show ? m.marker.addTo(map) : map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() { document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length; }
function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }
function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`).then(r => r.json()).then(res => {
        if (res.features.length) {
            const [lon, lat] = res.features[0].geometry.coordinates;
            map.flyTo([lat, lon], 12);
        }
    });
}
chargerDonnees();
