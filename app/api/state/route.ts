import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { seeds, quote, transitions, today } from '../../../lib/domain';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
function db(){if(!env.DB)throw new Error('DB unavailable');return env.DB;}
async function initialize(owner:string){
 const d=db(), now=new Date().toISOString();
 await d.batch([d.prepare('INSERT OR IGNORE INTO settings (owner,fee_bps) VALUES (?,500)').bind(owner),...seeds.map((s,i)=>d.prepare('INSERT OR IGNORE INTO listings (id,owner,seed_key,title,category,provider,zone,description,features,price,active,available,demo,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,1,1,?)').bind(crypto.randomUUID(),owner,String(i),s.title,s.category,s.provider,s.zone,s.description,s.features,s.price,now))]);
}
async function state(owner:string){
 const d=db(); const [profile,listings,requests,favorites,reviews,settings]=await Promise.all([
 d.prepare('SELECT name,role FROM profiles WHERE owner=?').bind(owner).first(),d.prepare('SELECT * FROM listings WHERE owner=? ORDER BY created_at,id').bind(owner).all(),d.prepare('SELECT * FROM requests WHERE owner=? ORDER BY created_at DESC').bind(owner).all(),d.prepare('SELECT listing_id FROM favorites WHERE owner=?').bind(owner).all<{listing_id:string}>(),d.prepare('SELECT * FROM reviews WHERE owner=?').bind(owner).all(),d.prepare('SELECT fee_bps FROM settings WHERE owner=?').bind(owner).first<{fee_bps:number}>()]);
 return {profile,listings:listings.results,requests:requests.results,favorites:favorites.results.map(f=>f.listing_id),reviews:reviews.results,feeBps:settings?.fee_bps??500};
}
export async function GET(){try{const user=await getChatGPTUser();if(!user)return json({error:'Inicia sesión para abrir tu piloto privado.'},401);await initialize(user.userId);return json(await state(user.userId));}catch(e){console.error('state load failed',e);return json({error:'No pudimos cargar la información. Inténtalo de nuevo.'},503);}}
const str=(value:unknown,max=2000)=>typeof value==='string'?value.trim().slice(0,max):'';
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Origen no permitido.'},403);
 const user=await getChatGPTUser();if(!user)return json({error:'Tu sesión terminó. Inicia sesión de nuevo.'},401);
 if(Number(request.headers.get('content-length')??0)>20000)return json({error:'Formulario demasiado grande.'},413);
 const parsed=await request.json();if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))return json({error:'Formulario no válido.'},400);const b=parsed as Record<string, any>;const owner=user.userId,d=db(),now=new Date().toISOString(),id=str(b.id,100);const invalid=(error:string)=>json({error},400);
 if(b.action==='profile'){
 const name=str(b.name,80);if(name.length<2||!['Estudiante','Prestador'].includes(b.role)||b.consent!==true)return invalid('Completa el nombre, el perfil y la autorización de datos.');
 await d.prepare('INSERT INTO profiles (owner,name,role,consent,created_at) VALUES (?,?,?,1,?) ON CONFLICT(owner) DO UPDATE SET name=excluded.name,role=excluded.role,consent=1').bind(owner,name,b.role,now).run();
 }else{
 if(!await d.prepare('SELECT name FROM profiles WHERE owner=?').bind(owner).first())return invalid('Primero completa tu perfil.');
 if(b.action==='fee'){
 const bps=Number(b.bps);if(!Number.isInteger(bps)||bps<0||bps>2000)return invalid('La tarifa de prueba debe estar entre 0 y 20 %.');await d.prepare('UPDATE settings SET fee_bps=? WHERE owner=?').bind(bps,owner).run();
 }else if(b.action==='listing'){
 const title=str(b.title,100),provider=str(b.provider,100),zone=str(b.zone,60),description=str(b.description,1200),features=str(b.features,300),price=Number(b.price);
 if(title.length<5||provider.length<2||!['Zona urbana','Zona rural'].includes(zone)||description.length<15||!['Hospedaje','Alimentación'].includes(b.category)||!Number.isInteger(price)||price<1000||price>10000000)return invalid('Revisa el título, prestador, zona, descripción y precio entre $1.000 y $10.000.000.');
 if(id){if(!await d.prepare('SELECT id FROM listings WHERE id=? AND owner=?').bind(id,owner).first())return json({error:'Publicación no encontrada.'},404);await d.prepare('UPDATE listings SET title=?,provider=?,zone=?,description=?,features=?,price=?,category=?,available=? WHERE id=? AND owner=?').bind(title,provider,zone,description,features,price,b.category,b.available?1:0,id,owner).run();}
 else await d.prepare('INSERT INTO listings (id,owner,title,provider,zone,description,features,price,category,active,available,demo,created_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,1,?)').bind(crypto.randomUUID(),owner,title,provider,zone,description,features,price,b.category,b.available?1:0,now).run();
 }else if(b.action==='listing-status')await d.prepare('UPDATE listings SET active=? WHERE owner=? AND id=?').bind(b.active?1:0,owner,id).run();
 else if(b.action==='favorite'){
 if(!await d.prepare('SELECT id FROM listings WHERE owner=? AND id=?').bind(owner,id).first())return json({error:'Oferta no encontrada.'},404);
 if(b.saved)await d.prepare('INSERT OR IGNORE INTO favorites (id,owner,listing_id) VALUES (?,?,?)').bind(crypto.randomUUID(),owner,id).run();else await d.prepare('DELETE FROM favorites WHERE owner=? AND listing_id=?').bind(owner,id).run();
 }else if(b.action==='request'){
 const key=str(b.key,80);if(!/^[0-9a-f-]{36}$/i.test(key))return invalid('Solicitud no válida. Vuelve a abrir la oferta.');if(await d.prepare('SELECT id FROM requests WHERE owner=? AND idempotency_key=?').bind(owner,key).first())return json(await state(owner));
 const l=await d.prepare('SELECT * FROM listings WHERE owner=? AND id=? AND active=1 AND available=1').bind(owner,id).first<{title:string;category:string;provider:string;price:number}>();if(!l)return invalid('Esta oferta ya no está disponible.');
 const qty=Number(b.quantity);if(!Number.isInteger(qty)||qty<1||qty>(l.category==='Hospedaje'?1:30))return invalid('Selecciona una cantidad válida.');const date=str(b.date,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date<today())return invalid('Elige una fecha válida desde hoy.');
 const setting=await d.prepare('SELECT fee_bps FROM settings WHERE owner=?').bind(owner).first<{fee_bps:number}>();const bps=setting?.fee_bps??500,q=quote(l.price,qty,bps);if(Number(b.expectedTotal)!==q.total)return json({error:'El precio o la tarifa cambiaron. Revisa el nuevo total antes de confirmar.'},409);
 await d.prepare('INSERT OR IGNORE INTO requests (id,owner,listing_id,title,category,provider,quantity,date,note,base,fee,fee_bps,total,status,idempotency_key,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,\'Pendiente\',?,?)').bind(crypto.randomUUID(),owner,id,l.title,l.category,l.provider,qty,date,str(b.note,800),q.base,q.fee,bps,q.total,key,now).run();
 }else if(b.action==='request-status'){
 const r=await d.prepare('SELECT status FROM requests WHERE owner=? AND id=?').bind(owner,id).first<{status:string}>();if(!r)return json({error:'Solicitud no encontrada.'},404);if(!transitions[r.status]?.includes(b.status))return invalid('Ese cambio de estado no está permitido.');await d.prepare('UPDATE requests SET status=? WHERE owner=? AND id=? AND status=?').bind(b.status,owner,id,r.status).run();
 }else if(b.action==='review'){
 const r=await d.prepare('SELECT listing_id,status FROM requests WHERE owner=? AND id=?').bind(owner,id).first<{listing_id:string;status:string}>();if(!r||r.status!=='Completada')return invalid('Solo puedes valorar un servicio completado.');const rating=Number(b.rating),comment=str(b.comment,600);if(!Number.isInteger(rating)||rating<1||rating>5||comment.length<5)return invalid('Elige de 1 a 5 estrellas y escribe al menos 5 caracteres.');await d.prepare('INSERT INTO reviews (id,owner,request_id,listing_id,rating,comment,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(owner,request_id) DO UPDATE SET rating=excluded.rating,comment=excluded.comment').bind(crypto.randomUUID(),owner,id,r.listing_id,rating,comment,now).run();
 }else return invalid('Acción no reconocida.');
 }
 return json(await state(owner));
 }catch(e){console.error('state save failed',e);return json({error:'No pudimos guardar. Conservamos el formulario para que puedas intentarlo de nuevo.'},503);}}
