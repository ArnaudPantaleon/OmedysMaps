const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
        "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat", checked: true },
        "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
        "TYPE_ESMS": { color: "#475569", label: "Afficher ESMS", checked: false }
    }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const searchInput = document.getElementById('query'); // adapte selon ton HTML
const suggestionList = document.getElementById('suggestions'); // un élément <ul> ou <div> pour la liste
let markersStore = [];

function formatPhone(num) {
    if (!num) return "N/C";
    let cleaned = ('' + num).replace(/\D/g, '');
    let match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    return match ? match.slice(1).join(' ') : num;
}

// Ajuster la luminosité d'une couleur hex
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

// Copier l'adresse dans le presse-papiers
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

                // === POPUP BENTO V2 ===
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
                                    <div class="info-icon">🧑‍💻</div>
                                    <div class="info-content">
                                        <span class="info-label">Responsable</span>
                                        <span class="info-value">${item.ATT || "Non assigné"}</span>
                                    </div>
                                </div>
                                
                                <div class="info-card">
                                    <div class="info-icon">📞</div>
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

                markersStore.push({ marker, status: item.Statut, isESMS });
                applyVisibility(markersStore[markersStore.length - 1]);
            }
        });
        renderFilters();
    } catch (err) { 
        console.error('Erreur chargement données:', err); 
    }
}

function applyVisibility(item) {
    const show = CONFIG.status[item.status]?.checked && (item.isESMS ? CONFIG.status["TYPE_ESMS"].checked : true);
    show ? item.marker.addTo(map) : map.removeLayer(item.marker);
}

function renderFilters() {
    document.getElementById('filter-list').innerHTML = Object.keys(CONFIG.status).map(key => `
        <div class="filter-item ${CONFIG.status[key].checked ? 'active' : ''}" onclick="toggleFilter('${key}')">
            <span class="dot" style="background:${CONFIG.status[key].color}"></span>
            <span class="filter-label">${CONFIG.status[key].label}</span>
        </div>`).join('');
    updateStats();
}

window.toggleFilter = (k) => { 
    CONFIG.status[k].checked = !CONFIG.status[k].checked; 
    markersStore.forEach(applyVisibility); 
    renderFilters(); 
};

function updateStats() { 
    document.getElementById('site-count').innerText = markersStore.filter(m => map.hasLayer(m.marker)).length; 
}

function toggleMenu() { 
    document.getElementById('menu-btn').classList.toggle('active'); 
    document.getElementById('side-menu').classList.toggle('open'); 
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    if (!q) return;
    
    fetch(`https://free.bedrijfsdata.nl/v1.1/geocoding?country_code=fr&q=${encodeURIComponent(q)}`)
        .then(r => r.json())
        .then(res => {
            if (res.geocoding.length) { 
                const lat = res.geocoding[0].lat; 
                const lon = res.geocoding[0].lon; 
                map.flyTo([lat, lon], 12); 
                document.getElementById('query').value = '';
            } else {
                alert('⚠️ Aucun lieu trouvé');
            }
        })
        .catch(err => console.error('Erreur recherche:', err));
}

/*// Lancer recherche avec Entrée
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('query')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') rechercheEtZoom();
    });
});*/

// === GESTION DES SUGGESTIONS AMÉLIORÉE ===
const searchInput = document.getElementById('query');
const suggestionBox = document.getElementById('suggestions');

let debounceTimer = null;
let currentRequest = null;

// Afficher les suggestions
function displaySuggestions(data) {
    if (!data.geocoding || data.geocoding.length === 0) {
        suggestionBox.innerHTML = '<div class="suggestion-item empty">Aucun lieu trouvé</div>';
        return;
    }

    // Dédupliquer par municipality + postcode
    const seen = new Set();
    const unique = data.geocoding.filter(item => {
        const key = `${item.municipality}-${item.postcode}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    suggestionBox.innerHTML = unique.map((item, idx) => `
        <div class="suggestion-item" onclick="selectSuggestion('${item.municipality}', ${item.lat}, ${item.lon}, ${idx})">
            <div class="suggestion-header">
                <span class="suggestion-city">${item.municipality}</span>
                <span class="suggestion-zip">${item.postcode || ''}</span>
            </div>
            <div class="suggestion-meta">
                <span class="suggestion-province">${item.province || ''}</span>
                <span class="suggestion-country">${item.country_code}</span>
            </div>
        </div>
    `).join('');
}

// Cacher les suggestions
function hideSuggestions() {
    suggestionBox.innerHTML = '';
}

// Sélectionner une suggestion
window.selectSuggestion = (city, lat, lon, idx) => {
    searchInput.value = city;
    hideSuggestions();
    map.flyTo([lat, lon], 13);
};

// Récupérer les suggestions avec débounce
function fetchSuggestions(query) {
    if (query.trim().length < 2) {
        hideSuggestions();
        return;
    }

    // Annuler la requête précédente
    if (currentRequest) {
        currentRequest.abort?.();
    }

    const controller = new AbortController();
    currentRequest = controller;

    fetch(
        `https://free.bedrijfsdata.nl/v1.1/geocoding?country_code=fr&q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
    )
        .then(r => r.json())
        .then(data => {
            displaySuggestions(data);
        })
        .catch(err => {
            if (err.name !== 'AbortError') {
                console.error('Erreur recherche:', err);
            }
        });
}

// Écouter les modifications de l'input
searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value;

    if (query.trim().length === 0) {
        hideSuggestions();
        return;
    }

    // Débounce: attendre 300ms avant de chercher
    debounceTimer = setTimeout(() => {
        fetchSuggestions(query);
    }, 300);
});

// Cacher les suggestions au clic en dehors
document.addEventListener('click', (e) => {
    if (!e.target.closest('.bento-search') && !e.target.closest('#suggestions')) {
        hideSuggestions();
    }
});

// Entrer pour valider la recherche actuelle
searchInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        hideSuggestions();
        rechercheEtZoom();
    }
});

startApp();
