// === FONCTION MENU (définir d'abord) ===
const CONFIG = {
    // === FILTRES PAR STATUT (Couleurs) ===
    status: {
        "Ouvert": { color: "#009597", label: "Cabinets Omedys", description: "Ouverts", checked: true },
        "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", description: "485 sites", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat", description: "89 sites", checked: true },
        "Ouverture en cours": { color: "#3498db", label: "En cours d'ouverture", description: "142 sites", checked: false }
    },
    
    // === FILTRES PAR TMS (Interrupteurs) ===
    tms: {
        isActive: false,
        filters: {
            "TMS 10": { label: "TMS 10 - Troyes", location: "Aube", count: 0, checked: false },
            "TMS 11": { label: "TMS 11 - Narbonne", location: "Aude", count: 0, checked: false },
            "TMS 14": { label: "TMS 14 - Caen", location: "Calvados", count: 0, checked: false },
            "TMS 18": { label: "TMS 18 - Bourges", location: "Cher", count: 0, checked: false },
            "TMS 21": { label: "TMS 21 - Dijon", location: "Côte-d'Or", count: 0, checked: false },
            "TMS 26": { label: "TMS 26 - Montélimar", location: "Drôme", count: 0, checked: false },
            "TMS 28": { label: "TMS 28 - Chartres", location: "Eure-et-Loir", count: 0, checked: false },
            "TMS 31": { label: "TMS 31 - Toulouse", location: "Haute-Garonne", count: 0, checked: false },
            "TMS 41": { label: "TMS 41 - Blois", location: "Loir-et-Cher", count: 0, checked: false },
            "TMS 54": { label: "TMS 54 - Nancy", location: "Meurthe-et-Moselle", count: 0, checked: false },
            "TMS 55": { label: "TMS 55 - Verdun", location: "Meuse", count: 0, checked: false },
            "TMS 59": { label: "TMS 59 - Lille", location: "Nord", count: 0, checked: false },
            "TMS 72": { label: "TMS 72 - Le Mans", location: "Sarthe", count: 0, checked: false }
        }
    },
    
    // === FILTRE PAR TYPE (Interrupteur) ===
    type: {
        ESMS: { label: "Afficher les ESMS", description: "EHPAD, Foyers, FAM...", count: 0, checked: false }
    }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const searchInput = document.getElementById('query');
const suggestionBox = document.getElementById('suggestions');

let debounceTimer = null;
let markersStore = [];

function formatPhone(num) {
    if (!num) return "N/C";
    let cleaned = ('' + num).replace(/\D/g, '');
    let match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    return match ? match.slice(1).join(' ') : num;
}

function adjustBrightness(color, percent) {
    let hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.min(255, Math.floor(r + (r * percent / 100)));
    g = Math.min(255, Math.floor(g + (g * percent / 100)));
    b = Math.min(255, Math.floor(b + (b * percent / 100)));
    
    return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function copyAddress(address) {
    if (!address || address === "Non disponible") {
        alert('⚠️ Adresse non disponible');
        return;
    }
    navigator.clipboard.writeText(address).then(() => {
        alert('✓ Adresse copiée !');
    }).catch(() => {
        console.error('Erreur copie');
    });
}

async function startApp() {
    try {
        const [salles, cabinets] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        const rawData = [...(salles[0]?.data || []), ...(cabinets[0]?.data || [])];
        
        // Compter les sites par TMS
        rawData.forEach(item => {
            if (item.TMS && CONFIG.tms.filters[item.TMS]) {
                CONFIG.tms.filters[item.TMS].count++;
            }
        });
        
        // Compter les ESMS
        rawData.forEach(item => {
            const isESMS = ["EHPAD", "Foyer", "FAM", "MAS"].some(t => (item.Type || "").includes(t));
            if (isESMS) CONFIG.type.ESMS.count++;
        });
        
        rawData.forEach(item => {
            const lat = parseFloat(String(item.Latitude || item.Lat || "").replace(',', '.'));
            const lng = parseFloat(String(item.Longitude || item.Lng || "").replace(',', '.'));

            if (!isNaN(lat) && !isNaN(lng)) {
                const isESMS = ["EHPAD", "Foyer", "FAM", "MAS"].some(t => (item.Type || "").includes(t));
                const color = CONFIG.status[item.Statut]?.color || "#94a3b8";

                const marker = L.circleMarker([lat, lng], {
                    radius: item.Type === "CABINET" ? 10 : 7,
                    fillColor: color, 
                    color: "#fff", 
                    weight: 2, 
                    fillOpacity: 0.9
                });

                const popupContent = `
                    <div class="bento-popup-v2">
                        <div class="popup-header-v2" style="background: linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, 20)} 100%)">
                            <div class="popup-badge" style="background:${color}">${item.Type || "N/C"}</div>
                            <h3 class="popup-title">${item.Name || item.Nom || "Site"}</h3>
                            <p class="popup-status">${item.Statut || "N/C"}</p>
                        </div>
                        
                        <div class="popup-body-v2">
                            <div class="popup-section">
                                <div class="info-card">
                                    <div class="info-icon">👤</div>
                                    <div class="info-content">
                                        <span class="info-label">Responsable</span>
                                        <span class="info-value">${item.ATT || "Non assigné"}</span>
                                    </div>
                                </div>
                                
                                <div class="info-card">
                                    <div class="info-icon">☎️</div>
                                    <div class="info-content">
                                        <span class="info-label">Téléphone</span>
                                        <a href="tel:${item.Phone || item.Telephone}" class="info-value link">
                                            ${formatPhone(item.Phone || item.Telephone)}
                                        </a>
                                    </div>
                                </div>
                                
                                <div class="address-card">
                                    <div class="address-icon">📍</div>
                                    <div class="address-content">
                                        <span class="info-label">Adresse</span>
                                        <p class="address-text">${item.Address || item.Adresse || "Non disponible"}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="popup-footer">
                                <button class="popup-btn-copy" onclick="copyAddress('${(item.Address || item.Adresse || "").replace(/'/g, "\\'")}')">📋 Copier</button>
                                <a href="https://www.google.com/maps/search/${encodeURIComponent(item.Address || item.Adresse || '')}" target="_blank" class="popup-btn-map">🗺️ Maps</a>
                            </div>
                        </div>
                    </div>`;

                marker.bindPopup(popupContent, { 
                    maxWidth: 320, 
                    className: 'custom-bento-popup-v2',
                    closeButton: true
                });

                markersStore.push({ 
                    marker, 
                    status: item.Statut, 
                    tms: item.TMS,
                    isESMS 
                });
                applyVisibility(markersStore[markersStore.length - 1]);
            }
        });
        
        renderFilters();
        return true;
    } catch (err) { 
        console.error('Erreur chargement données:', err);
        return false;
    }
}

function applyVisibility(item) {
    // Filtre statut
    const statusOk = CONFIG.status[item.status]?.checked !== false;
    
    // Filtre TMS (si actif)
    const tmsOk = !CONFIG.tms.isActive || (item.tms && CONFIG.tms.filters[item.tms]?.checked !== false);
    
    // Filtre ESMS
    const esmsOk = !item.isESMS || CONFIG.type.ESMS.checked;
    
    const show = statusOk && tmsOk && esmsOk;
    show ? item.marker.addTo(map) : map.removeLayer(item.marker);
}

function renderFilters() {
    const filtersHtml = `
        <!-- SECTION STATUT -->
        <div class="filter-section">
            <div class="section-title">
                <span>🎨 Affichage par statut</span>
                <span class="section-badge">${Object.keys(CONFIG.status).length}</span>
            </div>
            <div class="filter-info">
                💡 Les couleurs distinguent les différents statuts des sites
            </div>
            <div class="filters-grid">
                ${Object.entries(CONFIG.status).map(([key, config]) => `
                    <div class="filter-item color-filter ${config.checked ? 'active' : ''}" onclick="window.toggleStatusFilter('${key}')">
                        <div class="filter-dot" style="background: ${config.color};"></div>
                        <div class="filter-content">
                            <span class="filter-label">${config.label}</span>
                            <span class="filter-description">${config.description}</span>
                        </div>
                        <div class="filter-checkbox"></div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="filters-divider"></div>

        <!-- SECTION INTERRUPTEURS -->
        <div class="filter-section">
            <div class="section-title">
                <span>⚙️ Interrupteurs</span>
                <span class="section-badge">${Object.keys(CONFIG.tms.filters).length + 1}</span>
            </div>
            <div class="filter-info">
                💡 Activez/désactivez pour filtrer sans changer les couleurs
            </div>

            <!-- TMS -->
            <div style="margin-bottom: 14px;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding-left: 4px;">🎯 Centres TMS</div>
                <div class="filters-grid">
                    ${Object.entries(CONFIG.tms.filters).map(([key, config]) => `
                        <div class="filter-item toggle-filter ${config.checked ? 'active' : ''}" onclick="window.toggleTmsFilter('${key}')">
                            <div class="filter-content">
                                <span class="filter-label">${config.label}</span>
                                <span class="filter-description">${config.location}</span>
                            </div>
                            <span class="tms-badge">${config.count}</span>
                            <div class="toggle-switch"></div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- ESMS -->
            <div>
                <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding-left: 4px;">🏥 Type d'établissement</div>
                <div class="filters-grid">
                    <div class="filter-item toggle-filter ${CONFIG.type.ESMS.checked ? 'active' : ''}" onclick="window.toggleEsmsFilter()">
                        <div class="filter-content">
                            <span class="filter-label">${CONFIG.type.ESMS.label}</span>
                            <span class="filter-description">${CONFIG.type.ESMS.description}</span>
                        </div>
                        <span class="tms-badge">${CONFIG.type.ESMS.count}</span>
                        <div class="toggle-switch"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('filter-list').innerHTML = filtersHtml;
    updateStats();
}

window.toggleStatusFilter = (key) => {
    CONFIG.status[key].checked = !CONFIG.status[key].checked;
    markersStore.forEach(applyVisibility);
    renderFilters();
};

window.toggleTmsFilter = (key) => {
    CONFIG.tms.isActive = Object.values(CONFIG.tms.filters).some(f => f.checked);
    CONFIG.tms.filters[key].checked = !CONFIG.tms.filters[key].checked;
    CONFIG.tms.isActive = Object.values(CONFIG.tms.filters).some(f => f.checked);
    markersStore.forEach(applyVisibility);
    renderFilters();
};

window.toggleEsmsFilter = () => {
    CONFIG.type.ESMS.checked = !CONFIG.type.ESMS.checked;
    markersStore.forEach(applyVisibility);
    renderFilters();
};

function updateStats() { 
    document.getElementById('site-count').innerText = markersStore.filter(m => map.hasLayer(m.marker)).length; 
}

function toggleMenu() { 
    const menuBtn = document.getElementById('menu-btn');
    const sideMenu = document.getElementById('side-menu');
    
    if (!menuBtn || !sideMenu) {
        console.error('Menu elements not found');
        return;
    }
    
    menuBtn.classList.toggle('active');
    sideMenu.classList.toggle('open');
}

function displaySuggestions(features) {
    if (!features || features.length === 0) {
        suggestionBox.innerHTML = '<div class="suggestion-item empty">Aucun lieu trouvé</div>';
        return;
    }

    suggestionBox.innerHTML = features.map((feature, idx) => {
        const prop = feature.properties;
        const geometry = feature.geometry;
        const ctx = prop.context.split(', ');
        const displayContext = ctx.length > 1 ? `${ctx[1]} (${ctx[0]}), ${ctx[2]}` : prop.context;
        const municipality = prop.city;
        const postcode = prop.postcode;
        const lon = geometry.coordinates[0];
        const lat = geometry.coordinates[1];
        const safeName = municipality.replace(/'/g, "\\'");

        return `
            <div class="suggestion-item" onclick="window.selectSuggestion('${safeName}', ${lat}, ${lon}, ${idx})">
                <div class="suggestion-header">
                    <span class="suggestion-city"><strong>${municipality}</strong></span>
                    <span class="suggestion-zip">${postcode}</span>
                </div>
                <div class="suggestion-meta">
                    <span class="suggestion-province">${displayContext}</span>
                </div>
            </div>
        `;
    }).join('');
}

function hideSuggestions() {
    suggestionBox.innerHTML = '';
}

window.selectSuggestion = (city, lat, lon, idx) => {
    searchInput.value = city;
    hideSuggestions();
    map.flyTo([lat, lon], 13);
};

async function fetchSuggestions(query) {
    const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${query}&limit=30&type=municipality`);
    const data = await response.json();
    displaySuggestions(data.features);
}

searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;

    if (query.trim().length === 0) {
        hideSuggestions();
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, 300);
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.bento-search') && !e.target.closest('#suggestions')) {
        hideSuggestions();
    }
});

searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        hideSuggestions();
    }
});
function toggleMenu() { 
    document.getElementById('menu-btn').classList.toggle('active');
    document.getElementById('side-menu').classList.toggle('open');
}

// Attendre que le DOM soit complètement chargé
window.addEventListener('load', () => {
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.onclick = toggleMenu;
    }
});

startApp();
