const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat OMEDYS", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "En sourcing": { color: "#f1c40f", label: "En sourcing", checked: false },
    "Inactives": { color: "#95a5a6", label: "Inactives", checked: false },
    "Fermees ou refus OTT": { color: "#e74c3c", label: "Fermé / Refus", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher les ESMS", checked: false }
};

let map = L.map('map', { zoomControl: false }).setView([46.6, 2.0], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let allMarkers = [];

async function chargerDonnees() {
    try {
        const [res1, res2] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        const data = [...(res1[0]?.data || []), ...(res2[0]?.data || [])];
        creerMarqueurs(data);
    } catch (e) { console.error(e); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];
    data.forEach(item => {
        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const status = item.Statut || "Inconnu";
        const config = statusSettings[status] || { color: "#999", checked: true };
        
        const marker = L.circleMarker([lat, lng], {
            radius: 7, fillColor: config.color, color: "#fff", weight: 1, fillOpacity: 0.8
        }).bindPopup(`<b>${item.Name}</b>`);

        if (config.checked) marker.addTo(map);
        allMarkers.push({ marker, status, isESMS: (item.Type || "").includes("ESMS") });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `
            <label class="filter-item">
                <input type="checkbox" ${s.checked ? 'checked' : ''} onclick="toggleStatus('${key}', this.checked)">
                <span class="dot" style="background:${s.color}"></span>
                <span>${s.label}</span>
            </label>`;
    }).join('');
    
    if(!document.getElementById('stats-block')) {
        const sb = document.createElement('div');
        sb.id = 'stats-block'; sb.className = 'stats-block';
        sb.innerHTML = `<span id="site-count">0</span> sites`;
        document.getElementById('side-menu').appendChild(sb);
    }
    updateStats();
}

window.toggleStatus = (name, isChecked) => {
    statusSettings[name].checked = isChecked;
    allMarkers.forEach(m => {
        const visible = m.isESMS ? (statusSettings[m.status].checked && statusSettings["TYPE_ESMS"].checked) : statusSettings[m.status].checked;
        if (visible) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

function rechercheEtZoom() {
    const q = document.getElementById('query').value;
    fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
        .then(r => r.json()).then(res => {
            if (res.features.length) map.flyTo([res.features[0].geometry.coordinates[1], res.features[0].geometry.coordinates[0]], 12);
        });
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }
chargerDonnees();
