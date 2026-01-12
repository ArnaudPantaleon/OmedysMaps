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

const formatPhone = (n) => n ? String(n).replace(/\D/g, "").replace(/(\d{2})(?=\d)/g, "$1 ").trim() : "";

async function chargerDonnees() {
    const fetchTableau = async (url) => {
        try {
            const response = await fetch(url);
            let text = await response.text();
            
            // 1. Nettoyage n8n : Retire "data =" si présent
            if (text.includes('=')) {
                text = text.substring(text.indexOf('=') + 1).trim();
            }
            if (text.endsWith(';')) text = text.slice(0, -1);
            
            // 2. Réparation des virgules traînantes
            text = text.replace(/,\s*([\]}])/g, '$1');

            const parsed = JSON.parse(text);

            // 3. LOGIQUE D'EXTRACTION POUR TA STRUCTURE : [ { "data": [...] } ]
            if (Array.isArray(parsed) && parsed[0] && parsed[0].data) {
                return parsed[0].data; // C'est ici qu'on récupère ton contenu
            } 
            // Cas de secours si la structure change
            if (Array.isArray(parsed)) return parsed;
            if (parsed.data) return parsed.data;
            
            return [];
        } catch (e) {
            console.error("Erreur structure sur " + url + " :", e);
            return [];
        }
    };

    const [resS, resC] = await Promise.all([
        fetchTableau('salles.json'),
        fetchTableau('cabinet.json')
    ]);
    
    console.log("Salles chargées:", resS.length);
    console.log("Cabinets chargés:", resC.length);
    
    creerMarqueurs([...resS, ...resC]);
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        // Sécurité sur les noms de colonnes (Majuscules/Minuscules)
        const lat = parseFloat(String(item.Latitude || item.latitude || "").replace(',', '.'));
        const lng = parseFloat(String(item.Longitude || item.longitude || "").replace(',', '.'));
        
        if (isNaN(lat) || isNaN(lng)) return;

        const status = (item.Statut || item.statut || "").trim();
        const type = (item.Type || item.type || "SITE").trim().toUpperCase();
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };
        const isCabinet = type === "CABINET";

        const popupHtml = `
            <div class="bento-card">
                <div class="bento-header">
                    <span class="bento-type">${type}</span>
                    <span class="status-pill" style="background:${config.color}">${status}</span>
                </div>
                <h3 class="bento-title">${item.Name || item.name || "Site Omedys"}</h3>
                <div class="bento-info-row">
                    <div class="info-block">
                        <span class="info-label">ATT</span>
                        <span class="info-value">${item.ATT || item.Att || "—"}</span>
                    </div>
                    ${(item.TMS || item.Tms) ? `<div class="info-block"><span class="info-label">TMS</span><span class="info-value">${item.TMS || item.Tms}</span></div>` : ''}
                </div>
                <div class="bento-address"><span>📍</span><span>${item.Address || item.address || ""}</span></div>
                ${(item.Phone || item.Telephone) ? `
                <a href="tel:${String(item.Phone || item.Telephone).replace(/\s/g, '')}" class="bento-call">
                    <span>📞</span><span>${formatPhone(item.Phone || item.Telephone)}</span>
                </a>` : ''}
            </div>`;

        const m = L.circleMarker([lat, lng], {
            radius: isCabinet ? 10 : 7,
            fillColor: config.color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9,
            className: isCabinet ? 'pulse-marker' : ''
        });

        if (config.checked) m.addTo(map);
        m.bindPopup(popupHtml);
        allMarkers.push({ marker: m, status, isESMS: type.includes("ESMS") });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    if(!list) return;
    list.innerHTML = Object.keys(statusSettings).map(k => `
        <label class="filter-card" style="--status-color: ${statusSettings[k].color}">
            <input type="checkbox" ${statusSettings[k].checked ? 'checked' : ''} onchange="toggleStatus('${k}', this.checked)">
            <span class="dot"></span><span class="label">${statusSettings[k].label}</span>
        </label>`).join('');
    updateStats();
}

window.toggleStatus = (n, c) => {
    statusSettings[n].checked = c;
    allMarkers.forEach(m => {
        const show = m.isESMS ? (statusSettings[m.status].checked && statusSettings["TYPE_ESMS"].checked) : statusSettings[m.status].checked;
        show ? m.marker.addTo(map) : map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() { 
    const count = allMarkers.filter(m => map.hasLayer(m.marker)).length;
    if(document.getElementById('site-count')) document.getElementById('site-count').innerText = count; 
}

function toggleMenu() { document.getElementById('menuWrapper').classList.toggle('open'); }

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    if(!q) return;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`).then(r => r.json()).then(res => {
        if (res.features && res.features.length) {
            const [lon, lat] = res.features[0].geometry.coordinates;
            map.flyTo([lat, lon], 12);
        }
    });
}

chargerDonnees();
