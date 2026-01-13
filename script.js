// Initialisation de la carte
const map = L.map('map', { zoomControl: false }).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

// Nettoyage des TMS pour éviter les doublons
function formatTMS(val) {
    if (!val) return "N/A";
    let clean = val.toString().toUpperCase().replace("TMS", "").trim();
    return "TMS " + clean;
}

// Chargement des données avec fusion et détection de structure
async function loadData() {
    try {
        const [resSalles, resCabinet] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);

        // Extraction selon ta structure [{ "data": [...] }]
        const listSalles = (resSalles[0] && resSalles[0].data) ? resSalles[0].data : [];
        const listCabinet = (resCabinet[0] && resCabinet[0].data) ? resCabinet[0].data : [];

        allData = [...listSalles, ...listCabinet];
        console.log("Analyse : " + allData.length + " sites chargés.");

        createFilters(allData);
        updateDisplay();
        
        // Force le rafraîchissement du moteur Leaflet
        setTimeout(() => { map.invalidateSize(); }, 500);
    } catch (e) {
        console.error("Erreur d'analyse JSON :", e);
    }
}

// Affichage avec conversion forcée des virgules en points
function updateDisplay() {
    markersLayer.clearLayers();
    
    const filteredData = allData.filter(item => 
        activeFilters.size === 0 || activeFilters.has(item.Statut)
    );

    filteredData.forEach(item => {
        // --- CORRECTION CRITIQUE ---
        // On récupère Lat/Lng, on force en texte, on remplace la virgule par le point, 
        // puis on transforme en nombre flottant.
        const lat = parseFloat(String(item.Lat || item.lat || "").replace(',', '.'));
        const lng = parseFloat(String(item.Lng || item.lng || "").replace(',', '.'));

        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: getStatusColor(item.Statut),
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0.9
            });

            const popupContent = `
                <div class="bento-popup" style="width:230px; font-family:sans-serif;">
                    <h2 style="margin:0 0 10px 0; color:#009597; font-size:16px; font-weight:800;">${item.Nom || 'Site Omedys'}</h2>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                        <div style="background:#f1f5f9; padding:10px; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:8px; color:#64748b; font-weight:800; display:block; text-transform:uppercase;">Référent</span>
                            <span style="font-size:11px; font-weight:700; color:#0f172a;">${item.ATT || 'N/A'}</span>
                        </div>
                        <div style="background:#f1f5f9; padding:10px; border-radius:12px; border:1px solid #e2e8f0;">
                            <span style="font-size:8px; color:#64748b; font-weight:800; display:block; text-transform:uppercase;">Code</span>
                            <span style="font-size:11px; font-weight:700; color:#0f172a;">${formatTMS(item.TMS || item.Tms)}</span>
                        </div>
                    </div>
                    <div style="background:#f8fafc; padding:10px; border-radius:12px; margin-bottom:12px; border:1px solid #e2e8f0;">
                        <span style="font-size:8px; color:#64748b; font-weight:800; display:block; text-transform:uppercase;">Adresse</span>
                        <span style="font-size:11px; color:#0f172a;">${item.Adresse || 'N/A'}</span>
                    </div>
                    <a href="tel:${item.Tel}" style="display:block; text-align:center; background:#e0fcf9; color:#009597; padding:12px; border-radius:12px; text-decoration:none; font-weight:800; font-size:14px;">📞 Appeler le site</a>
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
        const card = document.createElement('label');
        card.className = 'filter-card';
        card.style.setProperty('--status-color', color);
        card.innerHTML = `
            <input type="checkbox" onchange="toggleFilter('${status}')">
            <span class="dot" style="background:${color};"></span>
            <span class="label">${status}</span>
        `;
        filterList.appendChild(card);
    });
}

function toggleFilter(status) {
    activeFilters.has(status) ? activeFilters.delete(status) : activeFilters.add(status);
    updateDisplay();
}

function toggleMenu() {
    document.getElementById('menuWrapper').classList.toggle('open');
}

async function rechercheEtZoom() {
    const query = document.getElementById('query').value;
    if (!query) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await res.json();
        if (data.length > 0) map.flyTo([data[0].lat, data[0].lon], 12);
    } catch(e) {}
}

loadData();
