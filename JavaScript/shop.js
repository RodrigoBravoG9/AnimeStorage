document.addEventListener('DOMContentLoaded', () => {
    const db = window.AnimeDB;
    const $ = id => document.getElementById(id);
    const landing = /\/landing\//.test(location.pathname);
    const imagePath = image => image.startsWith('assets/') ? (landing ? '../' : '') + image : image;
    const el = (tag, text, className) => {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    };
    const button = (text, action, secondary = false) => {
        const node = el('button', text, `landing-button${secondary ? ' secondary' : ''}`);
        node.type = 'button';
        node.addEventListener('click', () => attempt(action));
        return node;
    };
    const notice = message => {
        $('shop-status').textContent = message;
        $('shop-status').hidden = false;
    };
    const attempt = action => { try { return action(); } catch (error) { notice(error.message); } };
    const poster = product => {
        const image = el('img'); image.src = imagePath(product.image); image.alt = `Portada de ${product.title}`; image.loading = 'lazy';
        image.addEventListener('error', () => { image.removeAttribute('src'); image.alt = `Imagen no disponible: ${product.title}`; }, { once: true });
        return image;
    };
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let revision = 0;
    let deleteId;
    let homeSignature;
    let stopCarousel;
    function renderHome(state) {
        const track = document.querySelector('.learning-carousel-track');
        if (!track) return;
        const signature = JSON.stringify(state.products);
        if (signature === homeSignature) return;
        stopCarousel?.();
        track.replaceChildren();
        state.products.forEach(product => {
            const link = el('a', undefined, 'learning-carousel-card store-featured');
            link.href = 'landing/catalogo.html';
            link.setAttribute('aria-label', `${product.title}, ${db.money(product.price)}. Ver catálogo`);
            link.append(poster(product), el('span', `${product.title} · ${db.money(product.price)}`));
            track.append(link);
        });
        if (!state.products.length) track.append(el('p', 'El catálogo se está actualizando. Pronto encontrarás nuevas historias.', 'empty-state'));
        stopCarousel = window.animateLearningCarousel?.(track);
        homeSignature = signature;
    }
    function renderCatalog(state) {
        const grid = $('catalog-grid');
        if (!grid) return;
        const genre = $('catalog-genre');
        const current = genre.value;
        genre.replaceChildren(new Option('Todos los géneros', ''));
        [...new Set(state.products.flatMap(p => p.genre.split('·').map(g => g.trim())))].sort().forEach(g => genre.add(new Option(g, g)));
        genre.value = [...genre.options].some(o => o.value === current) ? current : '';
        const type = $('catalog-type').value;
        const products = state.products.filter(p => (!type || p.type === type) && normalize(p.title).includes(normalize($('catalog-search').value.trim())) && normalize(p.genre).includes(normalize(genre.value)));
        grid.replaceChildren();
        products.forEach(product => {
            const card = el('article', undefined, 'catalog-card');
            const copy = el('div', undefined, 'catalog-card-copy');
            copy.append(el('p', `${product.type === 'pelicula' ? 'Película' : 'Serie'} · ${product.genre}`, 'catalog-genre'), el('h2', product.title), el('p', product.description), el('strong', db.money(product.price), 'product-price'));
            const actions = el('div', undefined, 'shop-actions');
            actions.append(button('Ver reseña', () => {
                $('anime-dialog-title').textContent = product.title;
                $('anime-dialog-genre').textContent = `${product.genre} · ${db.money(product.price)}`;
                $('anime-dialog-description').textContent = product.description;
                $('anime-dialog').showModal();
            }, true), button('Agregar al carrito', () => { db.add(product.id); notice(`${product.title} agregado al carrito.`); }));
            copy.append(actions); card.append(poster(product), copy); grid.append(card);
        });
        $('catalog-count').textContent = `${products.length} títulos encontrados`;
        $('catalog-empty').hidden = products.length > 0;
        $('catalog-empty').textContent = type === 'pelicula' && !state.products.some(p => p.type === 'pelicula')
            ? 'No hay películas por el momento. Estarán disponibles cuando agreguemos una al catálogo.'
            : 'No encontramos títulos con esos filtros. Prueba otro nombre, género o tipo.';
    }
    function renderCart(state) {
        if (!$('cart-items')) return;
        revision = state.revision;
        const container = $('cart-items'); container.replaceChildren();
        let total = 0, units = 0;
        state.cart.forEach(item => {
            const product = state.products.find(p => p.id === item.id);
            if (!product) return;
            const row = el('article', undefined, 'cart-row');
            const copy = el('div');
            copy.append(el('h2', product.title), el('p', `${db.money(product.price)} por unidad`));
            const controls = el('div', undefined, 'quantity-controls');
            const minus = button('−', () => db.setQuantity(item.id, item.quantity - 1), true);
            minus.setAttribute('aria-label', `Quitar una unidad de ${product.title}`);
            const plus = button('+', () => db.setQuantity(item.id, item.quantity + 1), true);
            plus.disabled = item.quantity >= 99;
            plus.setAttribute('aria-label', `Agregar una unidad de ${product.title}`);
            minus.dataset.focusKey = `${item.id}-minus`; plus.dataset.focusKey = `${item.id}-plus`;
            controls.append(minus, el('span', String(item.quantity)), plus, button('Eliminar', () => db.setQuantity(item.id, 0), true));
            copy.append(controls);
            row.append(poster(product), copy, el('strong', db.money(product.price * item.quantity)));
            container.append(row); total += product.price * item.quantity; units += item.quantity;
        });
        if (!units) container.append(el('p', 'Tu carrito está vacío. Explora el catálogo para agregar animes.', 'empty-state'));
        $('cart-units').textContent = `${units} unidades`;
        $('cart-total').textContent = db.money(total);
        $('checkout').disabled = !units; $('clear-cart').disabled = !units;
        const history = $('order-history'); history.replaceChildren();
        state.orders.slice().reverse().forEach(order => {
            const card = el('article', undefined, 'order-card');
            card.append(el('h3', `Pedido ${order.id.slice(0, 8)}`), el('p', `${new Date(order.date).toLocaleString('es-CL')} · ${order.status}`));
            order.items.forEach(item => card.append(el('p', `${item.title} × ${item.quantity} · ${db.money(item.price * item.quantity)}`)));
            card.append(el('strong', `Total: ${db.money(order.total)}`)); history.append(card);
        });
        if (!state.orders.length) history.append(el('p', 'Todavía no tienes pedidos de prueba.'));
    }
    const resetForm = () => { $('product-form').reset(); $('product-id').value = ''; $('editor-title').textContent = 'Agregar anime'; };
    function renderAdmin(state) {
        if (!$('admin-list')) return;
        $('admin-list').replaceChildren();
        $('admin-count').textContent = `${state.products.length} animes · precios en CLP`;
        state.products.forEach(product => {
            const card = el('article', undefined, 'admin-row');
            const copy = el('div'); copy.append(el('h3', product.title), el('p', `${product.type === 'pelicula' ? 'Película' : 'Serie'} · ${product.genre} · ${db.money(product.price)}`));
            const actions = el('div', undefined, 'shop-actions');
            actions.append(button('Editar', () => {
                ['id', 'title', 'genre', 'type', 'price', 'image', 'description'].forEach(key => $(`product-${key}`).value = product[key]);
                $('editor-title').textContent = `Editar: ${product.title}`;
                $('product-title').focus();
                $('product-form').scrollIntoView({ block: 'center' });
            }, true), button('Eliminar', () => {
                deleteId = product.id;
                $('delete-description').textContent = `¿Quieres eliminar “${product.title}”?`;
                $('delete-dialog').showModal();
                $('delete-cancel').focus();
            }, true));
            card.append(poster(product), copy, actions); $('admin-list').append(card);
        });
        if (!state.products.length) $('admin-list').append(el('p', 'No hay animes. Agrega el primero desde el formulario.', 'empty-state'));
    }
    function render() {
        attempt(() => {
            const focusKey = document.activeElement?.dataset.focusKey;
            const state = db.read();
            document.querySelectorAll('[data-cart-count]').forEach(n => n.textContent = state.cart.reduce((sum, i) => sum + i.quantity, 0));
            renderCatalog(state); renderCart(state); renderAdmin(state); renderHome(state);
            if (focusKey) {
                const target = [...document.querySelectorAll('[data-focus-key]')].find(n => n.dataset.focusKey === focusKey);
                (target || $('cart-items'))?.focus();
            }
        });
    }
    if ($('catalog-search')) {
        const readType = () => {
            const type = new URLSearchParams(location.search).get('tipo');
            $('catalog-type').value = ['serie', 'pelicula'].includes(type) ? type : '';
        };
        const writeType = () => {
            const url = new URL(location.href);
            if ($('catalog-type').value) url.searchParams.set('tipo', $('catalog-type').value);
            else url.searchParams.delete('tipo');
            history.replaceState(null, '', url);
        };
        readType();
        $('catalog-type').addEventListener('change', () => { writeType(); render(); });
        window.addEventListener('popstate', () => { readType(); render(); });
        $('catalog-search').addEventListener('input', render);
        $('catalog-genre').addEventListener('change', render);
        $('catalog-reset').addEventListener('click', () => { $('catalog-search').value = ''; $('catalog-genre').value = ''; $('catalog-type').value = ''; writeType(); render(); $('catalog-search').focus(); });
    }
    if ($('checkout')) {
        $('cart-items').tabIndex = -1;
        $('checkout').addEventListener('click', () => attempt(() => {
            try {
                const order = db.checkout(revision);
                $('order-detail').textContent = `Pedido ${order.id.slice(0, 8)} · ${db.money(order.total)} · Sin cobro. Puedes revisar el detalle en tu historial.`;
                $('order-result').hidden = false;
                $('order-result').tabIndex = -1; $('order-result').focus();
                notice('Compra de prueba registrada. No se ha realizado ningún cobro.');
            } catch (error) { render(); throw error; }
        }));
        $('clear-cart').addEventListener('click', () => attempt(() => { db.clearCart(); notice('Carrito vaciado.'); }));
    }
    if ($('product-form')) {
        $('product-form').addEventListener('submit', event => {
            event.preventDefault();
            attempt(() => {
                const product = {};
                ['id', 'title', 'genre', 'type', 'price', 'image', 'description'].forEach(key => product[key] = $(`product-${key}`).value.trim());
                db.saveProduct(product); resetForm(); notice('Anime guardado. El catálogo y el carrito se actualizaron.');
            });
        });
        $('cancel-edit').addEventListener('click', resetForm);
        $('delete-cancel').addEventListener('click', () => $('delete-dialog').close());
        $('delete-confirm').addEventListener('click', () => attempt(() => {
            db.removeProduct(deleteId);
            if ($('product-id').value === deleteId) resetForm();
            $('delete-dialog').close(); notice('Anime eliminado del catálogo y del carrito.');
        }));
    }
    window.addEventListener('storechange', render);
    window.addEventListener('storage', event => { if (event.key === 'animestorage.database.v1' || event.key === null) { render(); notice('Datos actualizados desde otra pestaña.'); } });
    render();
});
