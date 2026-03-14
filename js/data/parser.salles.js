/**
 * parser.salles.js
 * Parse une ligne du fichier salles.json en objet site normalisé.
 * Champs source : Name, Location (objet), Phone, TMS, ATT, ATT_Mail,
 *                 MSS, Statut_TMS, Statut_Salle, Type,
 *                 Opening_hours, Equipments, Link, Notes
 */

export function parseSalle(row) {
  // --- Géolocalisation ---
  const loc = row.Location || {};

  // Location peut être un objet JSON ou une string JSON selon la source
  let location = loc;
  if (typeof loc === 'string') {
    try { location = JSON.parse(loc); } catch { return null; }
  }

  if (!location.lat || !location.lng) return null;

  // --- Équipements : virgules séparées ou tableau JSON ---
  let equipements = [];
  const rawEquip = (row.Equipments || '').trim();
  if (rawEquip) {
    try {
      const parsed = JSON.parse(rawEquip);
      equipements = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      equipements = rawEquip.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return {
    // identité
    id:          row.Name,          // pas de champ id dédié, on utilise Name
    name:        row.Name || '',
    dataset:     'salle',

    // géo
    lat:         Number(location.lat),
    lng:         Number(location.lng),
    city:        location.city?.long_name  || '',
    address:     location.address         || '',

    status:  row.Statut || "",
    mss:     row.MSS    || "",

    contact: {
      name:  row.ATT_Name  || "",
      mail:  row.ATT_Mail  || "",
      phone: row.ATT_Phone || ""
    }

    // TMS
    tms:         row.TMS       || '',
    statusTms:   row.Statut_TMS  || '',   // "Ouvert" | "Virtuel" | ""

    // salle
    status:      row.Statut_Salle || '',  // "Ouvertes" | "Ouverture en cours"
                                           // | "Telesecretariat OMEDYS"
                                           // | "ESMS ouvert au public"
    typeSite:    row.Type || '',

    // enrichissement
    horaires:    row.Opening_hours || '',
    equipements,
    lien:        row.Link  || '',
    notes:       row.Notes || '',
  };
}
