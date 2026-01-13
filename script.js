const statusSettings = {
    "Ouvert": { color: "#009597", label: "Cabinet Omedys", checked: true },
    "Ouvertes": { color: "#2ecc71", label: "Salles Ouvertes", checked: true },
    "Ouverture en cours": { color: "#3498db", label: "En cours", checked: false },
    "En sourcing": { color: "#f1c40f", label: "En sourcing", checked: false },
    "Inactives": { color: "#94a3b8", label: "Inactives", checked: false },
    "TYPE_ESMS": { color: "#334155", label: "Afficher les ESMS", checked: false } // Le filtre spécial
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

        const combined = [...(resSalles[0]?.data || []), ...(resCabinets[0]?.data || [])];
        
        combined.forEach(item => {
            const lat = parseFloat(String(item.Latitude || item.Lat).replace(',', '.'));
            const lng = parseFloat(String(item.Longitude || item.Lng).replace(',', '.'));

            if (!isNaN(lat) && !isNaN(lng)) {
                // Logique de détection ESMS
                const isESMS = ["EHPAD", "Foyer", "FAM", "MAS"].some(t => (item.Type || "").includes(t));

                const marker = L.circleMarker([lat, lng], {
                    radius: item.Type === "CABINET" ? 10 : 7,
                    fillColor: statusSettings[item.Statut]?.color || "#ccc",
                    color: "#fff", weight: 2, fillOpacity: 0.9
                });

                marker.bindPopup(`<b>${item.Nom || item.Name}</b><br>${item.Type}<br>${item.Adresse || item.Address}`);
                
                allMarkers.push({ marker, status: item.Statut, isESMS });

                // On n'affiche que si le statut est coché ET (ce n'est pas un ESMS OU le filtre ESMS est coché)
                if (statusSettings[item.Statut]?.checked && (!isESMS || statusSettings["TYPE_ESMS"].checked)) {
                    marker.addTo(map);
                }
            }
        });
        renderFiltres();
    } catch (e) { console.error(e); }
}

function renderFiltres() {
    const list = document.getElementById('filter-list');
    list.innerHTML = Object.keys(statusSettings).map(k => `
        <label class="filter-card">
            <input type="checkbox" ${statusSettings[k].checked ? 'checked' : ''} onchange="toggleFilter('${k}', this.checked)">
            <span class="dot" style="background:${statusSettings[k].color}"></span>
            ${statusSettings[k].label}
        </label>
    `).join('');
    updateStats();
}

window.toggleFilter = (key, checked) => {
    statusSettings[key].checked = checked;
    allMarkers.forEach(m => {
        const shouldShow = statusSettings[m.status].checked && (!m.isESMS || statusSettings["TYPE_ESMS"].checked);
        if (shouldShow) m.marker.addTo(map); else map.removeLayer(m.marker);
    });
    updateStats();
};

function updateStats() {
    document.getElementById('site-count').innerText = allMarkers.filter(m => map.hasLayer(m.marker)).length;
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

chargerDonnees();
