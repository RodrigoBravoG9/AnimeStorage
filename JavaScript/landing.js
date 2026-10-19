document.addEventListener('DOMContentLoaded', () => {
    const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const search = document.getElementById('catalog-search');
    if (search) {
        const genre = document.getElementById('catalog-genre');
        const cards = Array.from(document.querySelectorAll('.catalog-card'));
        const count = document.getElementById('catalog-count');
        const empty = document.getElementById('catalog-empty');
        const filter = () => {
            let visible = 0;
            cards.forEach(card => {
                const matches = normalize(card.dataset.title).includes(normalize(search.value.trim())) &&
                    normalize(card.dataset.genre).includes(normalize(genre.value));
                card.hidden = !matches;
                if (matches) visible++;
            });
            count.textContent = `${visible} ${visible === 1 ? 'título encontrado' : 'títulos encontrados'}`;
            empty.hidden = visible > 0;
        };
        search.addEventListener('input', filter);
        genre.addEventListener('change', filter);
        document.getElementById('catalog-reset').addEventListener('click', () => {
            search.value = '';
            genre.value = '';
            filter();
            search.focus();
        });
        const dialog = document.getElementById('anime-dialog');
        cards.forEach(card => {
            card.querySelector('[data-detail]').addEventListener('click', () => {
                document.getElementById('anime-dialog-title').textContent = card.dataset.title;
                document.getElementById('anime-dialog-genre').textContent = card.dataset.genre;
                document.getElementById('anime-dialog-description').textContent = card.querySelector('.catalog-card-copy > p:not(.catalog-genre)').textContent;
                dialog.showModal();
            });
        });
    }
    const form = document.getElementById('login-form');
    if (form) {
        form.querySelector('[type="submit"]').disabled = false;
        const password = document.getElementById('login-password');
        const toggle = document.getElementById('password-toggle');
        toggle.addEventListener('click', () => {
            const show = password.type === 'password';
            password.type = show ? 'text' : 'password';
            toggle.textContent = show ? 'Ocultar' : 'Mostrar';
            toggle.setAttribute('aria-pressed', String(show));
        });
        form.addEventListener('submit', event => {
            event.preventDefault();
            document.getElementById('login-status').textContent = 'Validación completada. Esta demostración no inicia sesión ni envía tus datos.';
            form.reset();
            password.type = 'password';
            toggle.textContent = 'Mostrar';
            toggle.setAttribute('aria-pressed', 'false');
        });
    }
});
