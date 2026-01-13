const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "Inactives": { color: "#94a3b8", label: "Inactives", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher les ESMS", checked: false }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let allMarkers = [];

async function charger() {
    const [s, c] = await Promise.all([fetch('salles.json').then(r=>r.json()), fetch('cabinet.json').then(r=>r.json())]);
    const data = [...(s[0]?.data || []), ...(c[0]?.data || [])];
    
    data.forEach(item => {
        const lat = parseFloat(String(item.Latitude || item.Lat).replace(',', '.'));
        const lng = parseFloat(String(item.Longitude || item.Lng).replace(',', '.'));
        if (!isNaN(lat) && !isNaN(lng)) {
            const isESMS = ["EHPAD", "MAS", "FAM"].some(t => (item.Type || "").includes(t));
            const marker = L.circleMarker([lat, lng], {
                radius: item.Type === "CABINET" ? 10 : 7,
                fillColor: statusSettings[item.Statut]?.color || "#ccc",
                color: "#fff", weight: 2, fillOpacity: 0.9
            }).bindPopup(`<b>${item.Nom || item.Name}</b>`);
            
            allMarkers.push({ marker, status: item.Statut, isESMS });
            if (statusSettings[item.Statut]?.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) marker.addTo(map);
        }
    });
    renderFiltres();
}

function renderFiltres() {
    document.getElementById('filter-list').innerHTML = Object.keys(statusSettings).map(k => `
        <label class="filter-card">
            <input type="checkbox" ${statusSettings[k].checked ? 'checked' : ''} onchange="toggleFilter('${k}', this.checked)">
            <span class="dot" style="background:${statusSettings[k].color}"></span>${statusSettings[k].label}
        </label>`).join('');
    updateCount();
}

function toggleFilter(key, checked) {
    statusSettings[key].checked = checked;
    allMarkers.forEach(m => {
        const show = statusSettings[m.status].checked && (!m.isESMS || statusSettings["TYPE_ESMS"].checked);
        show ? m.marker.addTo(map) : map.removeLayer(m.marker);
    });
    updateCount();
}

// Fonction pour l'animation du bouton et du menu
function toggleMenu() {
    document.getElementById('menu-btn').classList.toggle('open');
    document.getElementById('side-menu').classList.toggle('open');
}

function updateCount() {
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

charger();
