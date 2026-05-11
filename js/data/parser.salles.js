
/**
 * parser.salles.js
 * Parse une ligne du fichier salles.json en objet site normalisé.
 * Champs source : Name, Location (objet), Phone, TMS, ATT, ATT_Mail,
 *                 MSS, Statut_TMS, Statut_Salle, Type,
 *                 Opening_hours, Equipments, Link, Notes
 */

export function parseSalle(row) {

  let location
  try {
    location = typeof row.Location === "string"
      ? JSON.parse(row.Location)
      : row.Location || {}
  } catch {
    return null
  }

  if (!location.lat || !location.lng) return null
      
    let equipements = [];
    const rawEquip = (row.Equipments || '').trim();
    if (rawEquip) {
      try {
        const parsed = JSON.parse(rawEquip);
        equipements = Array.isArray(parsed) ? parsed : [String(parsed)];
      } catch {
        equipements = rawEquip.split('-').map(s => s.trim()).filter(Boolean);
      }
    }
  console.log(equipements);
  
  return {
    id:       row.id,
    name:     row.Name,
    type:     "salle",

    lat:      Number(location.lat),
    lng:      Number(location.lng),
    city:     location.city?.long_name || "",
    address:  location.address || "",

    status:   row.Statut_Salle || row.Statut || "",
    typeSite: row.Type || "",
    tms:      row.TMS  || "",
    mss:      row.MSS  || "",
    
    att: {
      name:  row.ATT_Name  || "",
      mail:  row.ATT_Mail  || "",
      phone: row.ATT_Phone || ""
    },
    contact: {
      phone: row.Phone    || ""
    },

    // enrichissement
    horaires:    row.Opening_hours || '',
    equipements: equipements || '',
    lien:        row.Link  || '',
    notes:       row.Notes || '',
  }

}
