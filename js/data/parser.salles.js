export function parseSalle(row){

let location

try{
location = JSON.parse(row.Location || "{}")
}catch{
return null
}

if(!location.lat || !location.lng) return null

return {

id: row.id,
name: row.Name,
type:"salle",

lat:Number(location.lat),
lng:Number(location.lng),

city:location.city?.long_name || "",
address:location.address || "",

status:row.Statut

}

}