/* Base local del prototipo. No sustituye un servidor ni controla permisos. */
(() => {
    const KEY = 'animestorage.database.v1';
    const clone = value => JSON.parse(JSON.stringify(value));
    const initial = () => ({ version: 1, revision: 0, products: clone(window.ANIME_SEED), cart: [], orders: [] });
    function read() {
        let raw;
        try { raw = localStorage.getItem(KEY); }
        catch { throw new Error('El navegador bloquea el almacenamiento. Habilítalo para usar la tienda.'); }
        if (!raw) return initial();
        try {
            const state = JSON.parse(raw);
            if (state.version !== 1 || !Number.isInteger(state.revision) || !Array.isArray(state.products) || !Array.isArray(state.cart) || !Array.isArray(state.orders)) throw new Error();
            state.products = state.products.map(product => ({ ...product, type: product.type || 'serie' }));
            return state;
        } catch { throw new Error('No se pudo leer la base local. No se han sobrescrito tus datos.'); }
    }
    function mutate(action) {
        const state = read();
        const result = action(state);
        state.revision++;
        try { localStorage.setItem(KEY, JSON.stringify(state)); }
        catch { throw new Error('No fue posible guardar. Revisa el espacio y los permisos del navegador.'); }
        window.dispatchEvent(new Event('storechange'));
        return result;
    }
    const id = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const validImage = value => typeof value === 'string' && (/^assets\/img\/[\w. -]+$/i.test(value) || /^https:\/\/[^\s]+$/i.test(value));
    function saveProduct(product) {
        const title = String(product.title || '').trim();
        const genre = String(product.genre || '').trim();
        const description = String(product.description || '').trim();
        const price = Number(product.price);
        const type = product.type || 'serie';
        if (!['serie', 'pelicula'].includes(type)) throw new Error('Selecciona Serie o Película como tipo de anime.');
        if (!title || title.length > 120 || !genre || genre.length > 120 || !description || description.length > 2000 || !Number.isSafeInteger(price) || price < 1 || price > 10000000 || !validImage(product.image)) throw new Error('Revisa el título, género, descripción, imagen y precio entero entre $1 y $10.000.000.');
        return mutate(state => {
            const entry = { id: product.id || id(), title, genre, type, description, image: product.image, price };
            const index = state.products.findIndex(p => p.id === entry.id);
            if (product.id && index < 0) throw new Error('Este anime fue eliminado. Actualiza la página.');
            if (index < 0) state.products.push(entry); else state.products[index] = entry;
            return entry;
        });
    }
    function setQuantity(productId, quantity) {
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) throw new Error('La cantidad debe ser un entero entre 0 y 99.');
        return mutate(state => {
            if (!state.products.some(p => p.id === productId)) throw new Error('Este anime ya no está disponible.');
            state.cart = state.cart.filter(item => item.id !== productId);
            if (quantity) state.cart.push({ id: productId, quantity });
        });
    }
    function checkout(revision) {
        return mutate(state => {
            if (state.revision !== revision) throw new Error('El carrito o los precios cambiaron. Revisa el total actualizado y confirma otra vez.');
            if (!state.cart.length) throw new Error('Agrega un anime antes de confirmar.');
            const items = state.cart.map(item => {
                const product = state.products.find(p => p.id === item.id);
                if (!product) throw new Error('Un anime dejó de estar disponible. Revisa tu carrito.');
                return { id: product.id, title: product.title, price: product.price, quantity: item.quantity };
            });
            const order = { id: id(), date: new Date().toISOString(), items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), status: 'Simulado · sin cobro' };
            state.orders.push(order);
            state.cart = [];
            return order;
        });
    }
    window.AnimeDB = {
        read, saveProduct, setQuantity, checkout,
        add(productId) { const state = read(); setQuantity(productId, (state.cart.find(i => i.id === productId)?.quantity || 0) + 1); },
        removeProduct(productId) { mutate(state => { state.products = state.products.filter(p => p.id !== productId); state.cart = state.cart.filter(i => i.id !== productId); }); },
        clearCart() { mutate(state => { state.cart = []; }); },
        money: value => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
    };
})();
