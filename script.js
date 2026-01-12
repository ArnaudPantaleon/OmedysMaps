const map = L.map('map', { zoomControl: false }).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

function toggleMenu() {
    document.getElementById('menuWrapper').classList.toggle('open');
}

function formatTMS(val) {
    if (!val) return "N/A";
    let clean = val.toString().toUpperCase().replace("TMS", "").trim();
    return "TMS " + clean;
}

// --- CHARGEMENT ET FUSION ---
async function loadData() {
    try {
        const [resSalle, resCabinet] = await Promise.all([
            fetch('salle.json'),
            fetch('cabinet.json')
        ]);

        const jsonSalle = await resSalle.json();
        const jsonCabinet = await resCabinet.json();

        // On extrait les tableaux "data" de chaque objet de la liste
        // Structure: [{data:[]}] -> on prend le premier élément [0].data
        const listSalle = jsonSalle[0].data || [];
        const listCabinet = jsonCabinet[0].data || [];

        allData = [...listSalle, ...listCabinet];
        
        createFilters(allData);
        updateDisplay();
    } catch (error) {
        console.error("Erreur de lecture des fichiers JSON :", error);
    }
}

function createFilters(data) {
    const statuses = [...new Set(data.map(item => item.Statut))].filter(s => s);
    const filterList = document.getElementById('filter-list');
    filterList.innerHTML = '';

    statuses.forEach(status => {
        const color = getStatusColor(status);
        const card = document.createElement('label');
        card.className = 'filter-card';
        card.style.setProperty('--status-color', color);
        card.innerHTML = `
            <input type="checkbox" value="${status}" onchange="toggleFilter('${status}')">
            <span class="dot"></span>
            <span class="label">${status}</span>
        `;
        filterList.appendChild(card);
    });
}

function toggleFilter(status) {
    activeFilters.has(status) ? activeFilters.delete(status) : activeFilters.add(status);
    updateDisplay();
}

function updateDisplay() {
    markersLayer.clearLayers();
    const filteredData = allData.filter(item => activeFilters.size === 0 || activeFilters.has(item.Statut));

    filteredData.forEach(item => {
        if (!item.Lat || !item.Lng) return;

        const marker = L.circleMarker([item.Lat, item.Lng], {
            radius: 9,
            fillColor: getStatusColor(item.Statut),
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
        });

        const popupContent = `
            <div class="bento-popup">
                <h2 class="bento-title">${item.Nom || 'Site Omedys'}</h2>
                <div class="bento-grid">
                    <div class="info-tile">
                        <span class="tile-label">Référent</span>
                        <span class="tile-value">${item.ATT || 'N/A'}</span>
                    </div>
                    <div class="info-tile">
                        <span class="tile-label">Code</span>
                        <span class="tile-value">${formatTMS(item.TMS || item.Tms)}</span>
                    </div>
                </div>
                <div class="info-tile" style="margin-bottom:12px;">
                    <span class="tile-label">Adresse</span>
                    <span class="tile-value">${item.Adresse || 'N/A'}</span>
                </div>
                <a href="tel:${item.Tel}" class="call-btn">📞 Appeler le site</a>
            </div>
        `;
        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
    document.getElementById('site-count').innerText = filteredData.length;
}

async function rechercheEtZoom() {
    const query = document.getElementById('query').value;
    if (!query) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await res.json();
        if (data.length > 0) {
            map.flyTo([data[0].lat, data[0].lon], 12);
        }
    } catch(e) {}
}

function getStatusColor(status) {
    const colors = { 'Actif': '#009597', 'En attente': '#f59e0b', 'Projet': '#6366f1', 'Maintenance': '#ef4444' };
    return colors[status] || '#94a3b8';
}

loadData();
