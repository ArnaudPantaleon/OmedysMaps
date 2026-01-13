const CONFIG = {
    status: {
        "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
        "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
        "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat", checked: true },
        "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
        "TYPE_ESMS": { color: "#1e293b", label: "Afficher ESMS", checked: false }
    }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markersStore = [];

function formatPhone(num) {
    if (!num) return "N/C";
    let cleaned = ('' + num).replace(/\D/g, '');
    let match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    return match ? match.slice(1).join(' ') : num;
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
                    fillColor: color, color: "#fff", weight: 2, fillOpacity: 0.9
                });

                const popupContent = `
                    <div class="bento-popup">
                        <div class="popup-header" style="background:${color}">${item.Name || item.Nom || "Site"}</div>
                        <div class="popup-body">
                            <div class="info-row"><b>Type</b><span>${item.Type || "N/C"}</span></div>
                            <div class="info-row"><b>ATT</b><span>${item.ATT || "N/C"}</span></div>
                            <div class="info-row"><b>Tel</b><span>${formatPhone(item.Phone || item.Telephone)}</span></div>
                            <div class="addr-block"><b>Adresse</b><br>${item.Address || item.Adresse || "N/C"}</div>
                        </div>
                    </div>`;

                marker.bindPopup(popupContent, { maxWidth: 260, className: 'custom-bento-popup' });
                markersStore.push({ marker, status: item.Statut, isESMS });
                applyVisibility(markersStore[markersStore.length - 1]);
            }
        });
        renderFilters();
    } catch (err) { console.error(err); }
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

window.toggleFilter = (k) => { CONFIG.status[k].checked = !CONFIG.status[k].checked; markersStore.forEach(applyVisibility); renderFilters(); };
function updateStats() { document.getElementById('site-count').innerText = markersStore.filter(m => map.hasLayer(m.marker)).length; }
function toggleMenu() { document.getElementById('menu-btn').classList.toggle('active'); document.getElementById('side-menu').classList.toggle('open'); }
function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`).then(r => r.json()).then(res => {
        if (res.features.length) { const [lon, lat] = res.features[0].geometry.coordinates; map.flyTo([lat, lon], 12); }
    });
}
startApp();
