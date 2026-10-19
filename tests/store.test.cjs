const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup(saved = new Map()) {
    const context = vm.createContext({ localStorage: { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) }, Event: class {}, Intl, console });
    context.window = context;
    context.dispatchEvent = () => {};
    for (const file of ['anime-seed.js', 'database.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../JavaScript/components', file), 'utf8'), context);
    return { db: context.AnimeDB, saved, context };
}
test('catalog edits and cart survive navigating to a fresh page', () => {
    const { db, saved } = setup();
    const product = db.read().products[0];
    db.saveProduct({ ...product, price: 7990 }); db.add(product.id); db.add(product.id);
    const otherPage = setup(saved).db;
    assert.equal(otherPage.read().products[0].price, 7990);
    assert.equal(otherPage.read().cart[0].quantity, 2);
});
test('checkout records current prices, clears cart, and preserves historical prices', () => {
    const { db } = setup(); const product = db.read().products[0];
    db.add(product.id); db.setQuantity(product.id, 3);
    const order = db.checkout(db.read().revision);
    assert.equal(order.total, product.price * 3);
    assert.equal(db.read().cart.length, 0);
    db.saveProduct({ ...product, price: 19990 });
    assert.equal(db.read().orders[0].items[0].price, product.price);
    assert.throws(() => db.checkout(db.read().revision), /Agrega/);
});
test('changed price requires review before checkout', () => {
    const { db } = setup(); const product = db.read().products[0];
    db.add(product.id); const revision = db.read().revision;
    db.saveProduct({ ...product, price: 9990 });
    assert.throws(() => db.checkout(revision), /cambiaron/);
    assert.equal(db.read().cart.length, 1);
    assert.equal(db.read().orders.length, 0);
});
test('deleting a product removes it from catalog and cart', () => {
    const { db } = setup(); const product = db.read().products[0];
    db.add(product.id); db.removeProduct(product.id);
    assert.equal(db.read().cart.length, 0);
    assert.equal(db.read().products.some(p => p.id === product.id), false);
    assert.throws(() => db.add(product.id), /disponible/);
});
test('invalid prices, unsafe image URLs and invalid quantities are rejected', () => {
    const { db } = setup(); const product = db.read().products[0];
    for (const price of [-1, 0, 1.5, Infinity, 10000001]) assert.throws(() => db.saveProduct({ ...product, price }));
    assert.throws(() => db.saveProduct({ ...product, image: 'javascript:alert(1)' }));
    for (const qty of [-1, 1.2, 100, NaN]) assert.throws(() => db.setQuantity(product.id, qty));
    db.setQuantity(product.id, 99);
    assert.throws(() => db.add(product.id));
});
test('create and edit an anime without losing its id', () => {
    const { db } = setup();
    const created = db.saveProduct({ title: 'Nuevo anime', genre: 'Acción', description: 'Una nueva historia.', image: 'assets/img/Sanda.jpg', price: 3490 });
    db.saveProduct({ ...created, title: 'Título editado', price: 5990 });
    assert.equal(db.read().products.find(p => p.id === created.id).title, 'Título editado');
    assert.equal(db.read().products.length, 11);
});
test('storage failures do not report a successful purchase', () => {
    const { db, context } = setup(); db.add(db.read().products[0].id);
    context.localStorage.setItem = () => { throw new Error('quota'); };
    assert.throws(() => db.checkout(db.read().revision), /guardar/);
    assert.equal(db.read().orders.length, 0);
    assert.equal(db.read().cart.length, 1);
});
test('all initial titles are series and existing saved products migrate without losing cart data', () => {
    const { db, saved } = setup();
    assert.ok(db.read().products.every(product => product.type === 'serie'));
    const state = db.read();
    state.products.forEach(product => delete product.type);
    state.cart = [{ id: state.products[0].id, quantity: 2 }];
    saved.set('animestorage.database.v1', JSON.stringify(state));
    const migrated = setup(saved).db.read();
    assert.ok(migrated.products.every(product => product.type === 'serie'));
    assert.equal(migrated.cart[0].quantity, 2);
    assert.equal(migrated.products.length, 10);
});
test('admin can add a movie and change a series to a movie persistently', () => {
    const { db, saved } = setup();
    const movie = db.saveProduct({ title: 'Película de prueba', genre: 'Fantasía', type: 'pelicula', description: 'Una historia.', image: 'assets/img/Sanda.jpg', price: 5990 });
    const series = db.read().products[0];
    db.saveProduct({ ...series, type: 'pelicula' });
    const products = setup(saved).db.read().products;
    assert.equal(products.filter(p => p.type === 'pelicula').length, 2);
    assert.equal(products.find(p => p.id === movie.id).type, 'pelicula');
    assert.throws(() => db.saveProduct({ ...movie, type: 'otro' }), /tipo/);
});
