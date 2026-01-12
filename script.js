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

async function chargerDonnees() {
    try {
        const [resS, resC] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        // Fusion des données
        const dataSalles = resS.data || (Array.isArray(resS) ? (resS[0].data || resS) : []);
        const dataCabinets = resC.data || (Array.isArray(resC) ? (resC[0].data || resC) : []);
        creerMarqueurs([...dataSalles, ...dataCabinets]);
    } catch (e) { console.error("Erreur chargement", e); }
}
function formatPhone(num) {
    if (!num) return "";
    let clean = num.replace(/\D/g, "");
    return clean.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const lat = parseFloat(item.Latitude), lng = parseFloat(item.Longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        // --- Définition des variables ---
        const status = (item.Statut || "").trim();
        const typeRaw = (item.Type || "SITE").trim(); // Correction ici : typeRaw est maintenant défini
        const isCabinet = typeRaw.toUpperCase() === "CABINET";
        const isESMS = typeRaw.toUpperCase().includes("ESMS") || typeRaw.toUpperCase().includes("EHPAD");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        
        const phone = item.Phone || item.Telephone || "";
        const att = item.ATT || item.Att || "";
        const tms = item.TMS || item.Tms || "";

        const displayPhone = formatPhone(phone);
        
       let popupContent = `
            <div class="bento-card">
                <div class="bento-header">
                    <span class="bento-type">${typeRaw.toUpperCase()}</span>
                    <span class="bento-status" style="background-color: ${config.color}">${status}</span>
                </div>
        
                <h3 class="bento-title">${item.Name}</h3>
                
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
                    <span class="pin-icon">📍</span>
                    <span class="address-text">${item.Address || ""}</span>
                </div>
        
                ${phone ? `
                <a href="tel:${phone.replace(/\s/g, '')}" class="bento-call-btn">
                    <span class="phone-icon">📞</span>
                    <span class="phone-number">${displayPhone}</span>
                </a>` : ''}
            </div>`;


        const marker = L.circleMarker([lat, lng], {
            radius: isCabinet ? 10 : 7,
            fillColor: config.color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9
        });

        // Logique d'affichage initiale
        const shouldShow = isESMS ? (config.checked && statusSettings["TYPE_ESMS"].checked) : config.checked;
        if (shouldShow) marker.addTo(map);

        marker.bindPopup(popupContent, { maxWidth: 300 });
        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(k => `
        <label class="filter-card" style="--status-color: ${statusSettings[k].color}">
            <input type="checkbox" ${statusSettings[k].checked ? 'checked' : ''} onchange="toggleStatus('${k}', this.checked)">
            <span class="dot"></span><span class="label">${statusSettings[k].label}</span>
        </label>`).join('');
    updateStats();
}

window.toggleStatus = (name, checked) => {
    statusSettings[name].checked = checked;
    allMarkers.forEach(m => {
        const config = statusSettings[m.status] || { checked: true };
        const show = m.isESMS ? (config.checked && statusSettings["TYPE_ESMS"].checked) : config.checked;
        if (show) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    const count = allMarkers.filter(m => map.hasLayer(m.marker)).length;
    document.getElementById('site-count').innerText = count;
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    if(!q) return;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
        .then(r => r.json()).then(res => {
            if (res.features && res.features.length) {
                const [lon, lat] = res.features[0].geometry.coordinates;
                map.flyTo([lat, lon], 12);
            }
        });
}

function toggleMenu() {
    document.getElementById('menuWrapper').classList.toggle('open');
}

// Lancement
chargerDonnees();
