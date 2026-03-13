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

  // Equipements : chaîne séparée par virgules ou tableau JSON
  let equipements = []
  if (row.Equipments) {
    try {
      equipements = JSON.parse(row.Equipments)
    } catch {
      equipements = row.Equipments.split(",").map(s => s.trim()).filter(Boolean)
    }
  }

  return {
    id:       row.id,
    name:     row.Name,
    type:     "salle",

    lat:      Number(location.lat),
    lng:      Number(location.lng),
    city:     location.city?.long_name || "",
    address:  location.address || "",

    status:   row.Statut_Salle || row.Statut || "",
    typeSite: row.Type     || "",
    tms:      row.TMS      || "",
    mss:      row.MSS      || "",

    contact: {
      name:  row.ATT      || "",
      mail:  row.ATT_Mail || "",
      phone: row.Phone    || ""
    },

    // Champs détails enrichis
    horaires:    row.Opening_hours || "",
    equipements: equipements,
    lien:        row.Link          || "",
    notes:       row.Notes         || ""
  }

}
