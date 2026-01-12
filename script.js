// --- CONFIGURATION INITIALE ---
const map = L.map('map', {
    zoomControl: false // On cache le zoom par défaut pour le look Bento
}).setView([46.603354, 1.888334], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let markersLayer = L.layerGroup().addTo(map);
let allData = [];
let activeFilters = new Set();

// --- LOGIQUE DU MENU ---
function toggleMenu() {
    const wrapper = document.getElementById('menuWrapper');
    wrapper.classList.toggle('open');
}

// --- NETTOYAGE DES DONNÉES (Fix Bug TMSTMS) ---
function formatTMS(val) {
    if (!val) return "N/A";
    // Supprime "TMS" s'il est déjà écrit pour éviter les doublons
    let clean = val.toString().toUpperCase().replace("TMS", "").trim();
    return "TMS " + clean;
}

// --- RÉCUPÉRATION DES DONNÉES ---
async function loadData() {
    try {
        // Remplace par l'URL de ton Google Apps Script
        const response = await fetch('TON_URL_APPS_SCRIPT');
        const data = await response.json();
        allData = data;
        
        createFilters(data);
        updateDisplay();
    } catch (error) {
        console.error("Erreur de chargement:", error);
    }
}

// --- CRÉATION DES FILTRES ---
function createFilters(data) {
    const statuses = [...new Set(data.map(item => item.Statut))];
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
    if (activeFilters.has(status)) {
        activeFilters.delete(status);
    } else {
        activeFilters.add(status);
    }
    updateDisplay();
}

// --- MISE À JOUR DE LA CARTE ---
function updateDisplay() {
    markersLayer.clearLayers();
    
    const filteredData = allData.filter(item => 
        activeFilters.size === 0 || activeFilters.has(item.Statut)
    );

    filteredData.forEach(item => {
        const marker = L.circleMarker([item.Lat, item.Lng], {
            radius: 8,
            fillColor: getStatusColor(item.Statut),
            color: '#fff',
            weight: 2,
            fillOpacity: 0.9
        });

        // Structure Bento pour la Popup
        const popupContent = `
            <div class="bento-card">
                <h2 class="bento-title">${item.Nom || 'Site Omedys'}</h2>
                <div class="bento-grid">
                    <div class="info-block">
                        <span class="info-label">ATT</span>
                        <span class="info-value">${item.ATT || 'N/A'}</span>
                    </div>
                    <div class="info-block">
                        <span class="info-label">CODE TMS</span>
                        <span class="info-value">${formatTMS(item.TMS || item.Tms)}</span>
                    </div>
                </div>
                <div class="info-block" style="margin-bottom: 15px;">
                    <span class="info-label">STATUT</span>
                    <span class="info-value" style="color:${getStatusColor(item.Statut)}">● ${item.Statut}</span>
                </div>
                <a href="tel:${item.Tel}" class="bento-call-btn">📞 Appeler le site</a>
            </div>
        `;

        marker.bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });

    document.getElementById('site-count').innerText = filteredData.length;
}

// --- RECHERCHE ET ZOOM ---
async function rechercheEtZoom() {
    const query = document.getElementById('query').value;
    if (!query) return;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await response.json();
        
        if (data.length > 0) {
            const { lat, lon } = data[0];
            map.flyTo([lat, lon], 12, { duration: 1.5 });
            
            // Sur mobile, on ferme le menu après une recherche
            if(window.innerWidth < 480) {
                document.getElementById('menuWrapper').classList.remove('open');
            }
        }
    } catch (error) {
        console.error("Erreur recherche:", error);
    }
}

// --- UTILITAIRES ---
function getStatusColor(status) {
    const colors = {
        'Actif': '#009597',
        'En attente': '#f59e0b',
        'Projet': '#6366f1',
        'Maintenance': '#ef4444'
    };
    return colors[status] || '#94a3b8';
}

// Lancement
loadData();
