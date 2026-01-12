const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "En sourcing": { color: "#f1c40f", label: "Sourcing", checked: false },
    "Inactives": { color: "#95a5a6", label: "Inactives", checked: false },
    "Fermees ou refus OTT": { color: "#e74c3c", label: "Fermés / Refus", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher ESMS", checked: false }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let allMarkers = [];

// Formatage XX XX XX XX XX
const formatPhone = (n) => {
    if (!n) return "";
    let clean = String(n).replace(/\D/g, "");
    return clean.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
};

async function chargerDonnees() {
    try {
        console.log("Tentative de chargement des JSON...");
        const [resS, resC] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);

        // Sécurisation : on extrait le tableau peu importe la structure
        const extract = (res) => {
            if (Array.isArray(res)) return res;
            if (res && res.data && Array.isArray(res.data)) return res.data;
            return [];
        };

        const dataFinal = [...extract(resS), ...extract(resC)];
        console.log("Données chargées :", dataFinal.length, "sites trouvés.");
        
        creerMarqueurs(dataFinal);
    } catch (e) {
        console.error("Erreur de chargement des fichiers JSON. Vérifiez qu'ils sont à la racine.", e);
    }
}

function creerMarqueurs(data) {
    if (!Array.isArray(data)) return;

    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        // Nettoyage coordonnées
        const lat = parseFloat(String(item.Latitude || "").replace(',', '.'));
        const lng = parseFloat(String(item.Longitude || "").replace(',', '.'));

        if (isNaN(lat) || isNaN(lng)) return;

        const status = (item.Statut || "").trim();
        const type = (item.Type || "SITE").trim().toUpperCase();
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const isCabinet = type === "CABINET";
        
        const phone = item.Phone || item.Telephone || "";
        const att = item.ATT || item.Att || "";
        const tms = item.TMS || item.Tms || "";

        const popupHtml = `
            <div class="bento-card">
                <div class="bento-header">
                    <span class="bento-type">${type}</span>
                    <span class="status-pill" style="background:${config.color}">${status}</span>
                </div>
                <h3 class="bento-title">${item.Name || "Site Omedys"}</h3>
                <div class="bento-info-row">
                    <div class="info-block">
                        <span class="info-label">ATT</span>
                        <span class="info-value">${att || "—"}</span>
                    </div>
                    ${tms ? `
                    <div class="info-block">
                        <span class="info-label">TMS</span>
                        <span class="info-value">${tms}</span>
                    </div>` : ''}
                </div>
                <div class="bento-address">
                    <span>📍</span><span>${item.Address || ""}</span>
                </div>
                ${phone ? `
                <a href="tel:${String(phone).replace(/\s/g, '')}" class="bento-call-btn">
                    <span>📞</span><span>${formatPhone(phone)}</span>
                </a>` : ''}
            </div>`;

        const marker = L.circleMarker([lat, lng], {
            radius: isCabinet ? 10 : 7,
            fillColor: config.color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9,
            className: isCabinet ? 'pulse-marker' : ''
        });

        if (config.checked) marker.addTo(map);
        marker.bindPopup(popupHtml);
        allMarkers.push({ marker, status, isESMS: type.includes("ESMS") });
    });

    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    if (!list) return;

    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `
            <label class="filter-card" style="--status-color: ${s.color}">
                <input type="checkbox" ${s.checked ? 'checked' : ''} onchange="toggleStatus('${key}', this.checked)">
                <span class="dot"></span>
                <span class="label">${s.label}</span>
            </label>`;
    }).join('');
    updateStats();
}

window.toggleStatus = (n, c) => {
    statusSettings[n].checked = c;
    allMarkers.forEach(m => {
        const isVisible = m.isESMS 
            ? (statusSettings[m.status].checked && statusSettings["TYPE_ESMS"].checked)
            : statusSettings[m.status].checked;
        
        if (isVisible) m.marker.addTo(map);
        else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    const count = allMarkers.filter(m => map.hasLayer(m.marker)).length;
    const el = document.getElementById('site-count');
    if (el) el.innerText = count;
}

function toggleMenu() {
    document.getElementById('menuWrapper').classList.toggle('open');
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    if (!q) return;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
        .then(r => r.json())
        .then(res => {
            if (res.features && res.features.length) {
                const [lon, lat] = res.features[0].geometry.coordinates;
                map.flyTo([lat, lon], 12);
            }
        });
}

// Initialisation
chargerDonnees();
