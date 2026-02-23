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

  const cpMatch = (loc.address || "").match(/\b(\d{5})\b/)
  const dept    = cpMatch ? cpMatch[1].slice(0, 2) : ""

  return {
    id:       row.id || row.Name,
    name:     row.Name,
    type:     "salle",

    lat:      Number(loc.lat),
    lng:      Number(loc.lng),

    city:     loc.city?.long_name || "",
    address:  loc.address || "",
    dept,

    status:   row.Statut_Salle || row.Statut || "",
    statusTMS: row.Statut_TMS  || "",

    tms:      row.TMS      || "",
    typeSite: row.Type     || "",

    contact: {
      name:  row.ATT      || "",
      mail:  row.ATT_Mail || "",
      phone: row.Phone    || ""
    },

    mss: row.MSS || ""
  }

}
