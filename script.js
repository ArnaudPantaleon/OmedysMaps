// 1. Initialisation avec sécurité de rendu
const map = L.map('map', { zoomControl: false }).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

// 2. Nettoyage des données (Sécurité totale)
function formatTMS(val) {
    if (!val) return "N/A";
    let clean = val.toString().toUpperCase().replace("TMS", "").trim();
    return "TMS " + clean;
}

// 3. Chargement avec détection de structure
async function loadData() {
    try {
        const [resSalles, resCabinet] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);

        // On gère ta structure [{ "data": [...] }]
        const listSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : [];
        const listCabinet = (resCabinet[0] && resCabinet[0].data) ? resCabinet[0].data : [];

        allData = [...listSalles, ...listCabinet];
        console.log("Analyse profonde : " + allData.length + " sites détectés.");

        createFilters(allData);
        updateDisplay();
        
        // Indispensable pour que les points apparaissent sur mobile
        setTimeout(() => { map.invalidateSize(); }, 500);
    } catch (e) {
        console.error("Erreur d'analyse JSON :", e);
    }
}

// 4. Affichage avec conversion de type forcée
function updateDisplay() {
    markersLayer.clearLayers();
    
    const filteredData = allData.filter(item => 
        activeFilters.size === 0 || activeFilters.has(item.Statut)
    );

    filteredData.forEach(item => {
        // On récupère Lat/Lng peu importe la majuscule et on force en nombre
        let rawLat = item.Lat || item.lat;
        let rawLng = item.Lng || item.lng;

        if (!rawLat || !rawLng) return;

        const lat = parseFloat(String(rawLat).replace(',', '.'));
        const lng = parseFloat(String(rawLng).replace(',', '.'));

        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
                radius: 9,
                fillColor: getStatusColor(item.Statut),
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.9
            });

            // Design Bento Popup
            const popupContent = `
                <div class="bento-popup" style="min-width:200px; padding:5px;">
                    <h2 style="margin:0 0 10px 0; color:#009597; font-size:16px;">${item.Nom || 'Site Omedys'}</h2>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
                        <div style="background:#f1f5f9; padding:8px; border-radius:10px;">
                            <span style="font-size:8px; color:#64748b; font-weight:800; display:block;">ATT</span>
                            <span style="font-size:11px; font-weight:700;">${item.ATT || 'N/A'}</span>
                        </div>
                        <div style="background:#f1f5f9; padding:8px; border-radius:10px;">
                            <span style="font-size:8px; color:#64748b; font-weight:800; display:block;">CODE</span>
                            <span style="font-size:11px; font-weight:700;">${formatTMS(item.TMS || item.Tms)}</span>
                        </div>
                    </div>
                    <p style="font-size:11px; margin:0 0 10px 0;">📍 ${item.Adresse || 'N/A'}</p>
                    <a href="tel:${item.Tel}" style="display:block; text-align:center; background:#e0fcf9; color:#009597; padding:10px; border-radius:10px; text-decoration:none; font-weight:800;">📞 Appeler</a>
                </div>`;

            marker.bindPopup(popupContent);
            markersLayer.addLayer(marker);
        }
    });

    const countEl = document.getElementById('site-count');
    if (countEl) countEl.innerText = filteredData.length;
}

function getStatusColor(status) {
    const colors = { 'Actif': '#009597', 'En attente': '#f59e0b', 'Projet': '#6366f1', 'Maintenance': '#ef4444' };
    return colors[status] || '#94a3b8';
}

function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }

function createFilters(data) {
    const statuses = [...new Set(data.map(item => item.Statut))].filter(s => s);
    const filterList = document.getElementById('filter-list');
    if (!filterList) return;
    filterList.innerHTML = '';

    statuses.forEach(status => {
        const color = getStatusColor(status);
        const card = document.createElement('label');
        card.className = 'filter-card';
        card.style.setProperty('--status-color', color);
        card.innerHTML = `
            <input type="checkbox" onchange="toggleFilter('${status}')">
            <span class="dot" style="background:${color}; width:8px; height:8px; border-radius:50%; display:inline-block; margin-right:10px;"></span>
            <span class="label">${status}</span>
        `;
        filterList.appendChild(card);
    });
}

function toggleFilter(status) {
    activeFilters.has(status) ? activeFilters.delete(status) : activeFilters.add(status);
    updateDisplay();
}

async function rechercheEtZoom() {
    const query = document.getElementById('query').value;
    if (!query) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
    const data = await res.json();
    if (data.length > 0) map.flyTo([data[0].lat, data[0].lon], 12);
}

loadData();
