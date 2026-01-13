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

// Nettoyage pour éviter le bug "TMS 18 TMS 18"
function formatTMS(val) {
    if (!val) return "N/A";
    let clean = val.toString().toUpperCase().replace("TMS", "").trim();
    return "TMS " + clean;
}

async function loadData() {
    try {
        // Chargement simultané des deux fichiers
        const [resSalles, resCabinet] = await Promise.all([
            fetch('salles.json').then(r => r.ok ? r.json() : null),
            fetch('cabinet.json').then(r => r.ok ? r.json() : null)
        ]);

        let listSalles = [];
        let listCabinet = [];

        // Extraction pour salles.json (Structure [{ "data": [...] }])
        if (resSalles && Array.isArray(resSalles) && resSalles[0].data) {
            listSalles = resSalles[0].data;
        }

        // Extraction pour cabinet.json (Structure [{ "data": [...] }])
        if (resCabinet && Array.isArray(resCabinet) && resCabinet[0].data) {
            listCabinet = resCabinet[0].data;
        }

        // Fusion complète
        allData = [...listSalles, ...listCabinet];
        
        console.log("Succès ! Total de sites chargés :", allData.length);
        
        createFilters(allData);
        updateDisplay();
    } catch (error) {
        console.error("Erreur fatale de lecture :", error);
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
    
    // On filtre les données selon les boutons cochés
    const filteredData = allData.filter(item => 
        activeFilters.size === 0 || activeFilters.has(item.Statut)
    );

    console.log("Tentative d'affichage de", filteredData.length, "points...");

    filteredData.forEach(item => {
        // --- SÉCURITÉ COORDONNÉES ---
        // On récupère Lat/Lng peu importe la casse (Lat, lat, Lng, lng)
        let rawLat = item.Lat || item.lat;
        let rawLng = item.Lng || item.lng;

        if (!rawLat || !rawLng) return;

        // On remplace la virgule par un point et on transforme en nombre
        const lat = parseFloat(String(rawLat).replace(',', '.'));
        const lng = parseFloat(String(rawLng).replace(',', '.'));

        // Si après ça ce n'est toujours pas un nombre valide, on ignore ce point
        if (isNaN(lat) || isNaN(lng)) {
            console.warn("Coordonnées invalides pour :", item.Nom, rawLat, rawLng);
            return;
        }

        // Création du point
        const marker = L.circleMarker([lat, lng], {
            radius: 9,
            fillColor: getStatusColor(item.Statut),
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
        });

        // Contenu de la popup (Design Bento)
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

    // Mise à jour du compteur visuel
    const countEl = document.getElementById('site-count');
    if (countEl) countEl.innerText = filteredData.length;
}
function getStatusColor(status) {
    const colors = { 'Actif': '#009597', 'En attente': '#f59e0b', 'Projet': '#6366f1', 'Maintenance': '#ef4444' };
    return colors[status] || '#94a3b8';
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
