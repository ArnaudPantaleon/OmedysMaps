export function parseCabinet(row){

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
type:"cabinet",

lat:Number(location.lat),
lng:Number(location.lng),

city:location.city?.long_name || "",
address:location.address || "",

status:row.Statut,

contact:{
name:row.ATT_Name,
mail:row.ATT_Mail,
phone:row.ATT_Phone
}

}

}