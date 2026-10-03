// Integrate as scripts/test-demo-store.ts. Compile with the existing TypeScript
// dependency to a temporary CommonJS directory, then run node --test on the
// emitted scripts/test-demo-store.js. No browser, network, or new dependency.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { mutateDemoState, readDemoState } from '../lib/demo-store';
import { quote, seeds, today } from '../lib/domain';

const STORAGE_KEY = 'sibate-conecta-demo-v1';
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const OriginalDate = Date;
class FakeStorage implements Storage {
  readonly values = new Map<string, string>();
  failRead = false;
  failWrite = false;
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) {
    if (this.failRead) throw new Error('Reading denied by browser');
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.failWrite) throw new Error('Storage quota exceeded');
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
}
let storage: FakeStorage;
const KEY_1 = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const KEY_2 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
function profile() {
  return mutateDemoState({ action: 'profile', name: 'Perfil ficticio', role: 'Estudiante', consent: true });
}
function request(overrides: Record<string, unknown> = {}) {
  return { action: 'request', id: 'demo-listing-1', key: KEY_1, quantity: 1, date: today(), note: 'Datos ficticios', expectedTotal: 498750, ...overrides };
}
function listing(overrides: Record<string, unknown> = {}) {
  return { action: 'listing', title: 'Alimento de demostración', provider: 'Prestador ficticio', zone: 'Zona urbana', description: 'Oferta ficticia para comprobar la demostración local.', features: 'Ejemplo', category: 'Alimentación', price: 10000, available: true, ...overrides };
}

describe('SIBATÉ-Conecta: datos y operaciones de demostración local', { concurrency: false }, () => {
  beforeEach(() => {
    storage = new FakeStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  });
  afterEach(() => {
    globalThis.Date = OriginalDate;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });

  test('inicia con seis ejemplos estables, sin perfil ni operaciones', () => {
    const state = readDemoState();
    assert.equal(state.listings.length, 6);
    assert.deepEqual(state.listings.map(l => l.id), seeds.map((_, index) => `demo-listing-${index + 1}`));
    assert.ok(state.listings.every(l => l.demo === 1));
    assert.equal(state.profile, null);
    assert.equal(state.feeBps, 500);
    assert.deepEqual([state.requests, state.favorites, state.reviews], [[], [], []]);
    state.listings[0].price = 1;
    assert.equal(readDemoState().listings[0].price, 475000);
  });

  test('exige consentimiento, nombre válido y uno de los dos roles', () => {
    assert.throws(() => mutateDemoState({ action: 'fee', bps: 1000 }), /perfil/);
    for (const fields of [
      { name: 'X', role: 'Estudiante', consent: true },
      { name: 'Perfil ficticio', role: 'Administrador', consent: true },
      { name: 'Perfil ficticio', role: 'Estudiante', consent: false },
    ]) assert.throws(() => mutateDemoState({ action: 'profile', ...fields }), /nombre de prueba/);
    assert.equal(storage.length, 0);
    assert.deepEqual(profile().profile, { name: 'Perfil ficticio', role: 'Estudiante' });
    assert.deepEqual(readDemoState().profile, { name: 'Perfil ficticio', role: 'Estudiante' });
  });

  test('persiste favoritos únicos y permite quitarlos', () => {
    profile();
    for (let attempt = 0; attempt < 2; attempt++) mutateDemoState({ action: 'favorite', id: 'demo-listing-1', saved: true });
    assert.deepEqual(readDemoState().favorites, ['demo-listing-1']);
    assert.throws(() => mutateDemoState({ action: 'favorite', id: 'missing', saved: true }), /no encontrada/);
    mutateDemoState({ action: 'favorite', id: 'demo-listing-1', saved: false });
    assert.deepEqual(readDemoState().favorites, []);
  });

  test('calcula la solicitud y conserva su tarifa cuando cambia la configuración', () => {
    profile();
    const initial = mutateDemoState(request()).requests[0];
    assert.deepEqual({ base: initial.base, fee: initial.fee, total: initial.total }, { base: 475000, fee: 23750, total: 498750 });
    assert.equal(initial.fee_bps, 500);
    for (const bps of [-1, 2001, 50.5]) assert.throws(() => mutateDemoState({ action: 'fee', bps }), /tarifa/);
    mutateDemoState({ action: 'fee', bps: 1000 });
    assert.equal(readDemoState().requests[0].total, 498750);
    assert.equal(readDemoState().requests[0].fee_bps, 500);
    assert.throws(() => mutateDemoState(request({ key: KEY_2 })), /cambiaron/);
    const updated = mutateDemoState(request({ key: KEY_2, expectedTotal: 522500 })).requests[0];
    assert.equal(updated.fee_bps, 1000);
    assert.equal(updated.total, 522500);
  });

  test('rechaza una cotización anterior y mantiene la instantánea de una oferta editada', () => {
    profile();
    const created = mutateDemoState(request()).requests[0];
    const originalListing = readDemoState().listings[0];
    mutateDemoState({ action: 'listing', ...originalListing, price: 500000, available: true });
    assert.equal(readDemoState().requests[0].base, created.base);
    assert.equal(readDemoState().requests[0].title, created.title);
    assert.throws(() => mutateDemoState(request({ key: KEY_2 })), /cambiaron/);
    assert.equal(readDemoState().requests.length, 1);
    assert.equal(mutateDemoState(request({ key: KEY_2, expectedTotal: 525000 })).requests[0].base, 500000);
  });

  test('usa la fecha de Bogotá en el cambio de día UTC y rechaza fechas imposibles o pasadas', () => {
    class FixedDate extends OriginalDate {
      constructor(value?: string | number | Date) {
        super(value === undefined ? '2026-01-02T02:00:00Z' : value instanceof OriginalDate ? value.getTime() : value);
      }
    }
    globalThis.Date = FixedDate as DateConstructor;
    profile();
    assert.equal(today(), '2026-01-01');
    for (const date of ['2025-12-31', '2026-02-30', 'not-a-date']) assert.throws(() => mutateDemoState(request({ date })), /fecha válida/);
    assert.equal(mutateDemoState(request({ date: '2026-01-01' })).requests[0].date, '2026-01-01');
  });

  test('limita hospedaje a una unidad y alimentación de una a treinta', () => {
    profile();
    for (const quantity of [0, 2, 1.5]) assert.throws(() => mutateDemoState(request({ quantity })), /cantidad/);
    for (const quantity of [0, 31, 1.5]) assert.throws(() => mutateDemoState(request({ id: 'demo-listing-4', quantity })), /cantidad/);
    const calculation = quote(14000, 30, 500);
    const created = mutateDemoState(request({ id: 'demo-listing-4', quantity: 30, expectedTotal: calculation.total })).requests[0];
    assert.equal(created.quantity, 30);
    assert.equal(created.total, 441000);
  });

  test('impide solicitar ofertas pausadas o sin disponibilidad', () => {
    profile();
    mutateDemoState({ action: 'listing-status', id: 'demo-listing-1', active: false });
    assert.throws(() => mutateDemoState(request()), /disponible/);
    mutateDemoState({ action: 'listing-status', id: 'demo-listing-1', active: true });
    mutateDemoState({ action: 'listing', ...readDemoState().listings[0], available: false });
    assert.throws(() => mutateDemoState(request()), /disponible/);
    assert.equal(readDemoState().requests.length, 0);
  });

  test('los reintentos con la misma clave no duplican la solicitud', () => {
    profile();
    assert.throws(() => mutateDemoState(request({ key: 'invalid' })), /Solicitud no válida/);
    const created = mutateDemoState(request()).requests[0];
    mutateDemoState({ action: 'listing-status', id: 'demo-listing-1', active: false });
    const retried = mutateDemoState(request({ expectedTotal: 0, quantity: 100 }));
    assert.equal(retried.requests.length, 1);
    assert.equal(retried.requests[0].id, created.id);
    assert.equal(readDemoState().requests.length, 1);
  });

  test('permite aceptar y completar, rechaza saltos y cambios desde estados finales', () => {
    profile();
    const id = mutateDemoState(request()).requests[0].id;
    assert.throws(() => mutateDemoState({ action: 'request-status', id, status: 'Completada' }), /permitido/);
    mutateDemoState({ action: 'request-status', id, status: 'Aceptada' });
    mutateDemoState({ action: 'request-status', id, status: 'Completada' });
    assert.equal(readDemoState().requests[0].status, 'Completada');
    assert.throws(() => mutateDemoState({ action: 'request-status', id, status: 'Cancelada' }), /permitido/);
    const secondId = mutateDemoState(request({ key: KEY_2 })).requests[0].id;
    mutateDemoState({ action: 'request-status', id: secondId, status: 'Cancelada' });
    assert.throws(() => mutateDemoState({ action: 'request-status', id: secondId, status: 'Aceptada' }), /permitido/);
  });

  test('valora solo servicios completados y conserva una reseña editable por solicitud', () => {
    profile();
    const id = mutateDemoState(request()).requests[0].id;
    const review = { action: 'review', id, rating: 5, comment: 'Comentario ficticio' };
    assert.throws(() => mutateDemoState(review), /completado/);
    mutateDemoState({ action: 'request-status', id, status: 'Aceptada' });
    mutateDemoState({ action: 'request-status', id, status: 'Completada' });
    assert.throws(() => mutateDemoState({ ...review, rating: 6 }), /estrellas/);
    assert.throws(() => mutateDemoState({ ...review, comment: 'X' }), /caracteres/);
    mutateDemoState(review);
    mutateDemoState({ ...review, rating: 4, comment: 'Comentario de prueba actualizado' });
    assert.equal(readDemoState().reviews.length, 1);
    assert.equal(readDemoState().reviews[0].rating, 4);
    assert.equal(readDemoState().reviews[0].request_id, id);
  });

  test('valida precio, crea y edita una oferta de prueba y permite pausarla', () => {
    profile();
    for (const price of [999, 10000001, 1000.5]) assert.throws(() => mutateDemoState(listing({ price })), /precio/);
    const state = mutateDemoState(listing());
    const created = state.listings[state.listings.length - 1];
    assert.equal(created.demo, 1);
    assert.equal(created.active, 1);
    mutateDemoState(listing({ id: created.id, price: 15000 }));
    assert.equal(readDemoState().listings.find(l => l.id === created.id)?.price, 15000);
    mutateDemoState({ action: 'listing-status', id: created.id, active: false });
    assert.equal(readDemoState().listings.find(l => l.id === created.id)?.active, 0);
  });

  test('un fallo al guardar conserva el formulario y el estado previo, y permite reintentar', () => {
    profile();
    const previous = storage.getItem(STORAGE_KEY);
    const form = request();
    const originalForm = JSON.stringify(form);
    storage.failWrite = true;
    assert.throws(() => mutateDemoState(form), /Conservamos el formulario/);
    assert.equal(storage.values.get(STORAGE_KEY), previous);
    assert.equal(JSON.stringify(form), originalForm);
    assert.equal(readDemoState().requests.length, 0);
    storage.failWrite = false;
    assert.equal(mutateDemoState(form).requests.length, 1);
    assert.equal(mutateDemoState(form).requests.length, 1);
  });

  test('propaga fallos de lectura y datos corruptos sin reemplazar el almacenamiento', () => {
    profile();
    const previous = storage.getItem(STORAGE_KEY);
    storage.failRead = true;
    assert.throws(readDemoState, /leer los datos/);
    assert.throws(() => mutateDemoState(request()), /leer los datos/);
    assert.equal(storage.values.get(STORAGE_KEY), previous);
    storage.failRead = false;
    storage.setItem(STORAGE_KEY, '{broken');
    assert.throws(readDemoState, /no son válidos/);
    assert.equal(storage.getItem(STORAGE_KEY), '{broken');
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    assert.throws(readDemoState, /no son compatibles/);
    assert.equal(storage.getItem(STORAGE_KEY), '{"version":99}');
  });
});
