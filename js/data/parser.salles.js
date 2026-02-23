export function parseSalle(row){

const location = row.Location || {}

if(!location?.lat || !location?.lng) return null

return {

id: row.Name + location.lat,

name: row.Name,

type:"salle",

lat:Number(location.lat),
lng:Number(location.lng),

city:location.city?.long_name || "",
address:location.address || "",

status:row.Statut_Salle || "Inconnu",

tms:row.TMS,

contact:{
name:row.ATT,
mail:row.ATT_Mail,
phone:row.Phone
},

meta:{
statutTMS:row.Statut_TMS,
structure:row.Type
}

}

}
