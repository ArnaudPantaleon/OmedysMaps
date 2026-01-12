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
    } catch (err) { console.error("Erreur:", err); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];
    data.forEach(item => {
        const lat = parseFloat(item.Latitude), lng = parseFloat(item.Longitude);
        if (isNaN(lat) || isNaN(lng)) return;
        const status = (item.Statut || "").trim();
        const typeRaw = (item.Type || "").trim().toUpperCase();
        const isESMS = typeRaw.includes("ESMS") || typeRaw.includes("EHPAD");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };

        const marker = L.circleMarker([lat, lng], {
            radius: typeRaw === "CABINET" ? 10 : 7,
            fillColor: config.color, color: "#fff", weight: 2, fillOpacity: 0.9
        });

        if (config.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) marker.addTo(map);
        
        const phone = item.Phone || item.Telephone || "";
        marker.bindPopup(`<b>${item.Name}</b><br>${item.Address || ""}${phone ? `<br><a href="tel:${phone}">${phone}</a>` : ""}`);
        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

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
