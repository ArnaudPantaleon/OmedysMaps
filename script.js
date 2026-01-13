// Initialisation standard
const map = L.map('map', { zoomControl: false }).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

// Analyse et formatage du code TMS
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

        // Extraction stricte de ta structure [{ "data": [...] }]
        const listSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : [];
        const listCabinet = (resCabinet[0] && resCabinet[0].data) ? resCabinet[0].data : [];

        allData = [...listSalles, ...listCabinet];
        console.log("Analyse : " + allData.length + " sites chargés en mémoire.");

        createFilters(allData);
        updateDisplay();
        
        // Indispensable : force le moteur de rendu à se caler sur le conteneur HTML
        setTimeout(() => { map.invalidateSize(); }, 500);
    } catch (e) {
        console.error("Erreur lecture JSON :", e);
    }
}

function updateDisplay() {
    markersLayer.clearLayers();
    
    const filteredData = allData.filter(item => 
        activeFilters.size === 0 || activeFilters.has(item.Statut)
    );

    filteredData.forEach(item => {
        // --- NETTOYAGE CRITIQUE DES COORDONNÉES ---
        // 1. On récupère la valeur (Lat ou lat)
        // 2. On transforme en texte .toString()
        // 3. On remplace la virgule par un point .replace(',', '.')
        // 4. On transforme en nombre décimal parseFloat()
        const lat = parseFloat((item.Lat || item.lat || "").toString().replace(',', '.'));
        const lng = parseFloat((item.Lng || item.lng || "").toString().replace(',', '.'));

        // On ne dessine que si les deux sont des nombres valides
        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
                radius: 9,
                fillColor: getStatusColor(item.Statut),
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.9
            });

            const popupContent = `
                <div class="bento-popup" style="width:220px;">
                    <h2 style="color:#009597; font-size:16px; margin:0 0 10px 0;">${item.Nom || 'Site Omedys'}</h2>
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

function createFilters(data) {
    const statuses = [...new Set(data.map(item => item.Statut))].filter(s => s);
    const filterList = document.getElementById('filter-list');
    if (!filterList) return;
    filterList.innerHTML = '';
    statuses.forEach(status => {
        const color = getStatusColor(status);
        filterList.innerHTML += `
            <label class="filter-card" style="--status-color: ${color}; display:flex; align-items:center; padding:10px; cursor:pointer;">
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
