export type Category = 'Hospedaje' | 'Alimentación';
export type Listing = { id:string; title:string; category:Category; provider:string; zone:string; description:string; features:string; price:number; active:number; available:number; demo:number };
export type Booking = { id:string; listing_id:string; title:string; category:Category; provider:string; quantity:number; date:string; note:string; base:number; fee:number; fee_bps:number; total:number; status:string; created_at:string };
export type Review = { request_id:string; listing_id:string; rating:number; comment:string };
export type State = { profile:{name:string;role:string}|null; listings:Listing[]; requests:Booking[]; favorites:string[]; reviews:Review[]; feeBps:number };
export const money = (value:number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(value);
export const quote = (price:number, quantity:number, bps:number) => {const base=price*quantity; const fee=Math.round(base*bps/10000); return {base,fee,total:base+fee};};
export const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const transitions:Record<string,string[]> = {Pendiente:['Aceptada','Rechazada','Cancelada'],Aceptada:['Completada','Cancelada'],Rechazada:[],Cancelada:[],Completada:[]};
export const seeds = [
{title:'Habitación con espacio para estudiar',category:'Hospedaje',provider:'Casa del Estudiante · ejemplo',zone:'Zona urbana',price:475000,description:'Una habitación individual para descansar y estudiar. Precio de ejemplo por un periodo de 30 días; condiciones sujetas a acuerdo con el prestador.',features:'Cama individual,Escritorio,Wi-Fi,Baño compartido'},
{title:'Habitación con baño privado',category:'Hospedaje',provider:'Hogar Sibaté · ejemplo',zone:'Zona urbana',price:620000,description:'Habitación individual con baño privado. Servicios incluidos en el precio de ejemplo por un periodo de 30 días.',features:'Baño privado,Wi-Fi,Servicios incluidos,Cama individual'},
{title:'Alojamiento compartido',category:'Hospedaje',provider:'Casa Compartida · ejemplo',zone:'Zona rural',price:390000,description:'Un cupo en habitación compartida por 30 días. Ubicación demostrativa; confirma transporte y condiciones antes de reservar.',features:'Habitación compartida,Cocina compartida,Servicios incluidos'},
{title:'Almuerzo casero del día',category:'Alimentación',provider:'Cocina de la Comunidad · ejemplo',zone:'Zona urbana',price:14000,description:'Almuerzo de ejemplo con sopa, proteína, arroz y ensalada. Confirma el menú y las restricciones alimentarias con el prestador.',features:'Sopa incluida,Recogida en el local,Menú del día'},
{title:'Desayuno para empezar el día',category:'Alimentación',provider:'Mesa Local · ejemplo',zone:'Zona urbana',price:9000,description:'Desayuno de ejemplo con huevos, arepa y bebida caliente. Precio por desayuno; disponibilidad a confirmar.',features:'Bebida caliente,Recogida en el local'},
{title:'Cena casera',category:'Alimentación',provider:'Cocina Familiar · ejemplo',zone:'Zona rural',price:12000,description:'Cena de ejemplo preparada en cocina familiar. Porción individual y recogida acordada con el prestador.',features:'Porción individual,Recogida en el local'}
];
