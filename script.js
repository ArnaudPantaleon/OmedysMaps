const map = L.map('map', { zoomControl: false }).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

function formatTMS(val) {
    if (!val) return "N/A";
    let clean = val.toString().toUpperCase().replace("TMS", "").trim();
    return "TMS " + clean;
}

async function loadData() {
    try {
        const [resSalles, resCabinet] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);

        // Extraction selon ta structure réelle [{ "data": [...] }]
        const listSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : [];
        const listCabinet = (resCabinet[0] && resCabinet[0].data) ? resCabinet[0].data : [];

        allData = [...listSalles, ...listCabinet];
        console.log("Données fusionnées :", allData.length);

        createFilters(allData);
        updateDisplay();
        
        // Force Leaflet à recalculer sa taille pour afficher les points
        setTimeout(() => { map.invalidateSize(); }, 500);
    } catch (e) {
        console.error("Erreur de chargement :", e);
    }
}

function updateDisplay() {
    markersLayer.clearLayers();
    const filteredData = allData.filter(item => activeFilters.size === 0 || activeFilters.has(item.Statut));

    filteredData.forEach(item => {
        // --- NETTOYAGE DES COORDONNÉES (CRITIQUE) ---
        const rawLat = item.Lat || item.lat;
        const rawLng = item.Lng || item.lng;

        if (!rawLat || !rawLng) return;

        // On transforme "47,123" en 47.123
        const lat = parseFloat(String(rawLat).replace(',', '.'));
        const lng = parseFloat(String(rawLng).replace(',', '.'));

        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: getStatusColor(item.Statut),
                color: '#fff',
                weight: 2,
                fillOpacity: 0.9
            });

            const popupContent = `
                <div class="bento-popup" style="min-width:200px">
                    <h2 style="color:#009597; font-size:16px; margin-bottom:10px;">${item.Nom}</h2>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                        <div style="background:#f1f5f9; padding:8px; border-radius:10px;">
                            <small style="font-size:8px; color:#64748b; font-weight:800; display:block;">ATT</small>
                            <span style="font-size:11px; font-weight:700;">${item.ATT || 'N/A'}</span>
                        </div>
                        <div style="background:#f1f5f9; padding:8px; border-radius:10px;">
                            <small style="font-size:8px; color:#64748b; font-weight:800; display:block;">CODE</small>
                            <span style="font-size:11px; font-weight:700;">${formatTMS(item.TMS || item.Tms)}</span>
                        </div>
                    </div>
                    <p style="font-size:11px;">📍 ${item.Adresse || 'N/A'}</p>
                    <a href="tel:${item.Tel}" style="display:block; text-align:center; background:#e0fcf9; color:#009597; padding:10px; border-radius:10px; text-decoration:none; font-weight:800; margin-top:10px;">📞 Appeler</a>
                </div>`;

            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        }
    });

    if(document.getElementById('site-count')) {
        document.getElementById('site-count').innerText = filteredData.length;
    }
}

function getStatusColor(status) {
    const colors = { 'Actif': '#009597', 'En attente': '#f59e0b', 'Projet': '#6366f1', 'Maintenance': '#ef4444' };
    return colors[status] || '#94a3b8';
}

function createFilters(data) {
    const statuses = [...new Set(data.map(item => item.Statut))].filter(s => s);
    const filterList = document.getElementById('filter-list');
    if (!filterList) return;
    filterList.innerHTML = '';
    statuses.forEach(status => {
        const color = getStatusColor(status);
        filterList.innerHTML += `
            <label class="filter-card" style="--status-color: ${color}; display:flex; align-items:center; margin-bottom:8px; cursor:pointer;">
                <input type="checkbox" onchange="toggleFilter('${status}')" style="display:none;">
                <span style="width:10px; height:10px; border-radius:50%; background:${color}; margin-right:10px;"></span>
                <span style="font-size:13px;">${status}</span>
            </label>`;
    });
}

function toggleFilter(status) {
    activeFilters.has(status) ? activeFilters.delete(status) : activeFilters.add(status);
    updateDisplay();
}

function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }

loadData();
