export function parseLocation(loc){

if(!loc) return null

if(typeof loc === "object") return loc

try{
return JSON.parse(loc)
}catch{
return null
}

}

export function formatPhone(num){

if(!num) return "N/C"

let cleaned=(''+num).replace(/\D/g,'')

if(cleaned.startsWith('33') && cleaned.length===11){
cleaned='0'+cleaned.slice(2)
}

if(cleaned.length===9){
cleaned='0'+cleaned
}

let m=cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)

return m ? m.slice(1).join(' ') : num

}

export function escapeHTML(str){
return String(str)
.replaceAll("&","&amp;")
.replaceAll("<","&lt;")
.replaceAll(">","&gt;")
.replaceAll('"',"&quot;")
.replaceAll("'","&#039;")
}