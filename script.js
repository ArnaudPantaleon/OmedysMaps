const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
        "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat", checked: true },
        "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
        "TYPE_ESMS": { color: "#1e293b", label: "Afficher ESMS", checked: false }
    }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markersStore = [];

async function startApp() {
    try {
        const [salles, cabinets] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);

        const rawData = [...(salles[0]?.data || []), ...(cabinets[0]?.data || [])];
        
        rawData.forEach(item => {
            const lat = parseFloat(String(item.Latitude || item.Lat || "").replace(',', '.'));
            const lng = parseFloat(String(item.Longitude || item.Lng || "").replace(',', '.'));

            if (!isNaN(lat) && !isNaN(lng)) {
                const isESMS = ["EHPAD", "Foyer", "FAM", "MAS"].some(t => (item.Type || "").includes(t));
                const marker = L.circleMarker([lat, lng], {
                    radius: item.Type === "CABINET" ? 10 : 7,
                    fillColor: CONFIG.status[item.Statut]?.color || "#94a3b8",
                    color: "#fff", weight: 2, fillOpacity: 0.9
                }).bindPopup(`<strong>${item.Nom || item.Name}</strong><br><small>${item.Adresse || item.Address}</small>`);

                markersStore.push({ marker, status: item.Statut, isESMS });
                applyVisibility(markersStore[markersStore.length - 1]);
            }
        });
        renderFilters();
    } catch (err) { console.error("Erreur d'initialisation", err); }
}

function renderFilters() {
    const container = document.getElementById('filter-list');
    container.innerHTML = Object.keys(CONFIG.status).map(key => `
        <div class="filter-item" onclick="toggleFilter('${key}')">
            <input type="checkbox" ${CONFIG.status[key].checked ? 'checked' : ''} style="margin-right:10px pointer-events:none">
            <span class="dot" style="background:${CONFIG.status[key].color}"></span>
            <span class="filter-label">${CONFIG.status[key].label}</span>
        </div>
    `).join('');
    updateStats();
}

window.toggleFilter = (key) => {
    CONFIG.status[key].checked = !CONFIG.status[key].checked;
    markersStore.forEach(applyVisibility);
    renderFilters();
};

function applyVisibility(item) {
    const showByStatus = CONFIG.status[item.status]?.checked;
    const showByESMS = item.isESMS ? CONFIG.status["TYPE_ESMS"].checked : true;
    
    if (showByStatus && showByESMS) item.marker.addTo(map);
    else map.removeLayer(item.marker);
}

function updateStats() {
    const count = markersStore.filter(m => map.hasLayer(m.marker)).length;
    document.getElementById('site-count').innerText = count;
}

function toggleMenu() {
    document.getElementById('menu-btn').classList.toggle('active');
    document.getElementById('side-menu').classList.toggle('open');
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

startApp();
