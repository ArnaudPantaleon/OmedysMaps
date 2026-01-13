const map = L.map('map', { zoomControl: false }).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }

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

        // Extraction structure [{ data: [...] }]
        const listSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : [];
        const listCabinet = (resCabinet[0] && resCabinet[0].data) ? resCabinet[0].data : [];

        allData = [...listSalles, ...listCabinet];
        console.log("Sites chargés :", allData.length);

        createFilters(allData);
        updateDisplay();
        
        // Rafraîchissement forcé pour mobile
        setTimeout(() => { map.invalidateSize(); }, 500);
    } catch (e) { console.error(e); }
}

function updateDisplay() {
    markersLayer.clearLayers();
    const filteredData = allData.filter(item => activeFilters.size === 0 || activeFilters.has(item.Statut));

    filteredData.forEach(item => {
        const lat = parseFloat(String(item.Lat).replace(',', '.'));
        const lng = parseFloat(String(item.Lng).replace(',', '.'));

        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
                radius: 9,
                fillColor: getStatusColor(item.Statut),
                color: '#fff',
                weight: 2,
                fillOpacity: 0.9
            });

            const popupContent = `
                <div class="bento-popup">
                    <h2 style="font-size:16px; color:var(--primary); margin:0 0 10px 0;">${item.Nom}</h2>
                    <div class="bento-grid">
                        <div class="info-tile"><span class="tile-label">ATT</span><span class="tile-value">${item.ATT || 'N/A'}</span></div>
                        <div class="info-tile"><span class="tile-label">CODE</span><span class="tile-value">${formatTMS(item.TMS || item.Tms)}</span></div>
                    </div>
                    <p style="font-size:11px; margin-bottom:10px;">📍 ${item.Adresse || 'N/A'}</p>
                    <a href="tel:${item.Tel}" class="call-btn">📞 Appeler</a>
                </div>`;
            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        }
    });
    document.getElementById('site-count').innerText = filteredData.length;
}

function createFilters(data) {
    const statuses = [...new Set(data.map(item => item.Statut))].filter(s => s);
    const filterList = document.getElementById('filter-list');
    filterList.innerHTML = '';
    statuses.forEach(status => {
        const color = getStatusColor(status);
        filterList.innerHTML += `
            <label class="filter-card" style="--status-color: ${color}">
                <input type="checkbox" onchange="toggleFilter('${status}')">
                <span class="dot"></span>
                <span class="label">${status}</span>
            </label>`;
    });
}

function toggleFilter(status) {
    activeFilters.has(status) ? activeFilters.delete(status) : activeFilters.add(status);
    updateDisplay();
}

function getStatusColor(status) {
    const colors = { 'Actif': '#009597', 'En attente': '#f59e0b', 'Projet': '#6366f1', 'Maintenance': '#ef4444' };
    return colors[status] || '#94a3b8';
}

async function rechercheEtZoom() {
    const query = document.getElementById('query').value;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await res.json();
    if (data.length > 0) map.flyTo([data[0].lat, data[0].lon], 12);
}

loadData();
