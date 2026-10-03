import { seeds, quote, transitions, today, type Category, type State } from './domain';

// Import only from the explicit static demonstration. This is not an API,
// authentication, a payment system, or shared persistence between devices.
const STORAGE_KEY = 'sibate-conecta-demo-v1';
type DemoStore = { version: 1; state: State; requestKeys: Record<string, string> };
const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const fail = (message: string): never => { throw new Error(message); };
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const category = (value: unknown): value is Category => value === 'Hospedaje' || value === 'Alimentación';
const integer = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const binary = (value: unknown) => value === 0 || value === 1;

function freshStore(): DemoStore {
  return {
    version: 1,
    state: {
      profile: null,
      listings: seeds.map((seed, index) => ({ ...seed, category: seed.category as Category, id: `demo-listing-${index + 1}`, active: 1, available: 1, demo: 1 })),
      requests: [], favorites: [], reviews: [], feeBps: 500,
    },
    requestKeys: {},
  };
}

function storage(): Storage {
  try {
    if (typeof globalThis.localStorage === 'undefined') return fail('El almacenamiento local no está disponible. Abre la demostración en un navegador.');
    return globalThis.localStorage;
  } catch {
    return fail('El navegador bloqueó el almacenamiento local. Habilítalo para guardar la demostración en este dispositivo.');
  }
}

// Reject damaged data without overwriting it or silently pretending it was saved.
function validStore(value: unknown): value is DemoStore {
  if (!isObject(value) || value.version !== 1 || !isObject(value.state) || !isObject(value.requestKeys)) return false;
  const s = value.state;
  if (!(s.profile === null || (isObject(s.profile) && typeof s.profile.name === 'string' && s.profile.name.length >= 2 && ['Estudiante', 'Prestador'].includes(String(s.profile.role))))) return false;
  if (!integer(s.feeBps, 0, 2000) || !Array.isArray(s.listings) || !Array.isArray(s.requests) || !Array.isArray(s.favorites) || !Array.isArray(s.reviews)) return false;
  const listings = s.listings;
  if (!listings.every(l => isObject(l) && typeof l.id === 'string' && typeof l.title === 'string' && category(l.category) && typeof l.provider === 'string' && typeof l.zone === 'string' && typeof l.description === 'string' && typeof l.features === 'string' && integer(l.price, 1000, 10000000) && binary(l.active) && binary(l.available) && l.demo === 1)) return false;
  const listingIds = new Set(listings.map(l => l.id));
  if (listingIds.size !== listings.length || !s.favorites.every(id => typeof id === 'string' && listingIds.has(id)) || new Set(s.favorites).size !== s.favorites.length) return false;
  const requests = s.requests;
  if (!requests.every(r => isObject(r) && typeof r.id === 'string' && typeof r.listing_id === 'string' && listingIds.has(r.listing_id) && typeof r.title === 'string' && category(r.category) && typeof r.provider === 'string' && integer(r.quantity, 1, r.category === 'Hospedaje' ? 1 : 30) && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && typeof r.note === 'string' && integer(r.base, 1000, 300000000) && integer(r.fee_bps, 0, 2000) && integer(r.fee, 0, 60000000) && r.fee === Math.round(Number(r.base) * Number(r.fee_bps) / 10000) && r.total === Number(r.base) + Number(r.fee) && typeof r.status === 'string' && Object.hasOwn(transitions, r.status) && typeof r.created_at === 'string')) return false;
  const requestIds = new Set(requests.map(r => r.id));
  if (requestIds.size !== requests.length || !Object.entries(value.requestKeys).every(([key, id]) => /^[0-9a-f-]{36}$/i.test(key) && typeof id === 'string' && requestIds.has(id))) return false;
  if (!s.reviews.every(r => isObject(r) && typeof r.request_id === 'string' && typeof r.listing_id === 'string' && integer(r.rating, 1, 5) && typeof r.comment === 'string' && r.comment.length >= 5 && requests.some(b => b.id === r.request_id && b.listing_id === r.listing_id && b.status === 'Completada'))) return false;
  return new Set(s.reviews.map(r => r.request_id)).size === s.reviews.length;
}

function readStore(): DemoStore {
  let raw: string | null;
  try { raw = storage().getItem(STORAGE_KEY); }
  catch { return fail('No pudimos leer los datos de demostración de este dispositivo. Revisa el almacenamiento del navegador.'); }
  if (raw === null) return freshStore();
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { return fail('Los datos locales de demostración no son válidos. No los hemos reemplazado.'); }
  if (!validStore(parsed)) return fail('Los datos locales de demostración no son compatibles. No los hemos reemplazado.');
  return parsed;
}

export function readDemoState(): State {
  return readStore().state;
}

export function mutateDemoState(body: Record<string, unknown>): State {
  if (!isObject(body)) return fail('Formulario no válido.');
  if (JSON.stringify(body).length > 20000) return fail('Formulario demasiado grande.');
  // Each mutation starts with a detached read. A failed validation or setItem
  // changes neither the stored state nor the caller's form object.
  const store = readStore();
  const state = store.state;
  const id = text(body.id, 100);
  if (body.action === 'profile') {
    const name = text(body.name, 80);
    if (name.length < 2 || (body.role !== 'Estudiante' && body.role !== 'Prestador') || body.consent !== true) return fail('Completa el nombre de prueba, el perfil y la autorización de almacenamiento local.');
    state.profile = { name, role: body.role };
  } else {
    if (!state.profile) return fail('Primero completa tu perfil de demostración.');
    if (body.action === 'fee') {
      const bps = Number(body.bps);
      if (!integer(bps, 0, 2000)) return fail('La tarifa de prueba debe estar entre 0 y 20 %.');
      state.feeBps = bps;
    } else if (body.action === 'listing') {
      const title = text(body.title, 100), provider = text(body.provider, 100), zone = text(body.zone, 60);
      const description = text(body.description, 1200), features = text(body.features, 300), price = Number(body.price);
      if (title.length < 5 || provider.length < 2 || !['Zona urbana', 'Zona rural'].includes(zone) || description.length < 15 || !category(body.category) || !integer(price, 1000, 10000000)) return fail('Revisa el título, prestador, zona, descripción y precio entre $1.000 y $10.000.000.');
      const fields = { title, provider, zone, description, features, price, category: body.category, available: body.available ? 1 : 0 };
      if (id) {
        const listing = state.listings.find(l => l.id === id);
        if (!listing) return fail('Publicación no encontrada.');
        Object.assign(listing, fields);
      } else state.listings.push({ ...fields, id: `demo-listing-${crypto.randomUUID()}`, active: 1, demo: 1 });
    } else if (body.action === 'listing-status') {
      const listing = state.listings.find(l => l.id === id);
      if (!listing) return fail('Publicación no encontrada.');
      listing.active = body.active ? 1 : 0;
    } else if (body.action === 'favorite') {
      if (!state.listings.some(l => l.id === id)) return fail('Oferta no encontrada.');
      if (body.saved && !state.favorites.includes(id)) state.favorites.push(id);
      else if (!body.saved) state.favorites = state.favorites.filter(saved => saved !== id);
    } else if (body.action === 'request') {
      const key = text(body.key, 80);
      if (!/^[0-9a-f-]{36}$/i.test(key)) return fail('Solicitud no válida. Vuelve a abrir la oferta.');
      if (Object.hasOwn(store.requestKeys, key)) return state;
      const listing = state.listings.find(l => l.id === id && l.active === 1 && l.available === 1);
      if (!listing) return fail('Esta oferta de demostración ya no está disponible.');
      const quantity = Number(body.quantity);
      if (!integer(quantity, 1, listing.category === 'Hospedaje' ? 1 : 30)) return fail('Selecciona una cantidad válida.');
      const date = text(body.date, 10), timestamp = Date.parse(`${date}T12:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date || date < today()) return fail('Elige una fecha válida desde hoy en Colombia.');
      const calculation = quote(listing.price, quantity, state.feeBps);
      if (Number(body.expectedTotal) !== calculation.total) return fail('El precio o la tarifa cambiaron. Revisa el nuevo total antes de confirmar.');
      const requestId = `demo-request-${crypto.randomUUID()}`;
      state.requests.unshift({ id: requestId, listing_id: id, title: listing.title, category: listing.category, provider: listing.provider, quantity, date, note: text(body.note, 800), ...calculation, fee_bps: state.feeBps, status: 'Pendiente', created_at: new Date().toISOString() });
      store.requestKeys[key] = requestId;
    } else if (body.action === 'request-status') {
      const request = state.requests.find(r => r.id === id);
      if (!request) return fail('Solicitud no encontrada.');
      if (typeof body.status !== 'string' || !transitions[request.status]?.includes(body.status)) return fail('Ese cambio de estado no está permitido.');
      request.status = body.status;
    } else if (body.action === 'review') {
      const request = state.requests.find(r => r.id === id);
      if (!request || request.status !== 'Completada') return fail('Solo puedes valorar un servicio completado de demostración.');
      const rating = Number(body.rating), comment = text(body.comment, 600);
      if (!integer(rating, 1, 5) || comment.length < 5) return fail('Elige de 1 a 5 estrellas y escribe al menos 5 caracteres.');
      const review = { request_id: id, listing_id: request.listing_id, rating, comment };
      const existing = state.reviews.findIndex(r => r.request_id === id);
      if (existing === -1) state.reviews.push(review);
      else state.reviews[existing] = review;
    } else return fail('Acción no reconocida.');
  }
  try { storage().setItem(STORAGE_KEY, JSON.stringify(store)); }
  catch { return fail('No pudimos guardar la demostración en este dispositivo. Conservamos el formulario para que puedas intentarlo de nuevo.'); }
  return state;
}
