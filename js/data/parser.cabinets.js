export function parseCabinet(row) {

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
    id:      row.id,
    name:    row.Name,
    type:    "cabinet",

    lat:     Number(loc.lat),
    lng:     Number(loc.lng),

    city:    loc.city?.long_name || "",
    address: loc.address || "",

    status:  row.Statut,

    contact: {
      name:  row.ATT_Name  || "",
      mail:  row.ATT_Mail  || "",
      phone: row.ATT_Phone || ""
    },

    mss: row.MSS || ""
  }

}
