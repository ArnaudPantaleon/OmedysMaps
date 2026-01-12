const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true, special: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Telesecretariat OMEDYS": { color: "#8956FB", label: "Télésecrétariat OMEDYS", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "En sourcing": { color: "#f1c40f", label: "En sourcing", checked: false },
    "Inactives": { color: "#95a5a6", label: "Inactives", checked: false },
    "Fermees ou refus OTT": { color: "#e74c3c", label: "Fermé / Refus", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher les ESMS", checked: false }
};

let map = L.map('map', { zoomControl: false }).setView([46.6033, 1.8883], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let allMarkers = [];

async function chargerDonnees() {
    try {
        const [resSalles, resCabinets] = await Promise.all([
            fetch('salles.json').then(r => r.json()),
            fetch('cabinet.json').then(r => r.json())
        ]);
        const data = [...(resSalles[0]?.data || []), ...(resCabinets[0]?.data || [])];
        creerMarqueurs(data);
    } catch (err) { console.error("Erreur:", err); }
}

function creerMarqueurs(data) {
    allMarkers.forEach(m => map.removeLayer(m.marker));
    allMarkers = [];

    data.forEach(item => {
        const status = (item.Statut || "Inconnu").trim();
        const type = (item.Type || "").trim().toUpperCase();
        const isESMS = type.includes("ESMS") || type.includes("EHPAD");
        const config = statusSettings[status] || { color: "#7f8c8d", checked: true };

        const marker = L.circleMarker([item.Latitude, item.Longitude], {
            radius: type === "CABINET" ? 10 : 7,
            fillColor: config.color, color: "#fff", weight: 2, fillOpacity: 0.9
        });

        if (config.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) {
            marker.addTo(map);
        }

        // Ajoutez ici votre code Popup complexe
        marker.bindPopup(`<b>${item.Name}</b><br>${status}`);
        allMarkers.push({ marker, status, isESMS });
    });
    renderFilters();
}

function renderFilters() {
    const list = document.getElementById('filter-list');
    list.className = "filter-list-container";
    list.innerHTML = Object.keys(statusSettings).map(key => {
        const s = statusSettings[key];
        return `
            <label class="filter-item ${s.special ? 'special-case' : ''}">
                <input type="checkbox" ${s.checked ? 'checked' : ''} onclick="toggleStatus('${key}', this.checked)">
                <span class="dot" style="background:${s.color}"></span>
                <span class="filter-label">${s.label}</span>
            </label>`;
    }).join('');

    if (!document.getElementById('stats-block')) {
        const sideMenu = document.getElementById('side-menu');
        const statsDiv = document.createElement('div');
        statsDiv.id = 'stats-block';
        statsDiv.className = 'stats-block';
        statsDiv.innerHTML = `<span id="site-count">0</span><span style="font-size:10px; font-weight:bold; color:#64748b; text-transform:uppercase;">Sites visibles</span>`;
        sideMenu.appendChild(statsDiv);
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

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

chargerDonnees();
