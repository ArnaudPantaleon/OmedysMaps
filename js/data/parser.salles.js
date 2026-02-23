export function parseSalle(row) {

  let loc

  try {
    loc = typeof row.Location === "string"
      ? JSON.parse(row.Location || "{}")
      : (row.Location || {})
  } catch {
    return null
  }

  if (!loc.lat || !loc.lng) return null

  return {
    id:      row.id || row.Name,
    name:    row.Name,
    type:    "salle",

    lat:     Number(loc.lat),
    lng:     Number(loc.lng),

    city:    loc.city?.long_name || "",
    address: loc.address || "",

    // Les salles utilisent Statut_Salle (pas Statut)
    status:  row.Statut_Salle || row.Statut || "",

    tms:     row.TMS || "",

    contact: {
      name:  row.ATT   || "",
      mail:  row.ATT_Mail || "",
      phone: row.Phone || ""
    },

    mss:     row.MSS || "",
    typeSite: row.Type || ""
  }

}
