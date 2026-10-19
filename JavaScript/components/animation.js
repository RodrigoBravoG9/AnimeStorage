/* Continuous carousel, rebuilt when the local catalog changes. */
window.animateLearningCarousel = track => {
    const carousel = track.parentElement;
    const originals = Array.from(track.children);
    if (!originals.length || !originals[0].classList.contains('learning-carousel-card')) return () => {};
    let frame;
    let distance = 0;
    let offset = 0;
    let previousTime;
    let paused = false;
    let cards = originals;
    const highlightCenter = () => {
        const bounds = carousel.getBoundingClientRect();
        const center = bounds.left + bounds.width / 2;
        let closest;
        let difference = Infinity;
        cards.forEach(card => {
            const position = bounds.left + card.offsetLeft - offset + card.offsetWidth / 2;
            const delta = Math.abs(position - center);
            if (delta < difference) { difference = delta; closest = card; }
        });
        cards.forEach(card => card.classList.toggle('is-center', card === closest));
    };
    const measure = () => {
        track.querySelectorAll('[data-carousel-clone]').forEach(card => card.remove());
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const first = originals[0];
        const last = originals[originals.length - 1];
        distance = last.offsetLeft + last.offsetWidth - first.offsetLeft + gap;
        if (distance <= 0) return;
        // Fill wide screens even when the catalog contains only one anime.
        const copies = Math.ceil(carousel.clientWidth / distance) + 1;
        for (let i = 0; i < copies; i++) {
            originals.forEach(card => {
                const copy = card.cloneNode(true);
                copy.dataset.carouselClone = '';
                copy.classList.remove('is-center');
                copy.setAttribute('aria-hidden', 'true');
                copy.tabIndex = -1;
                track.append(copy);
            });
        }
        cards = Array.from(track.children);
        offset %= distance;
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        highlightCenter();
    };
    const tick = time => {
        if (previousTime !== undefined && !paused && distance > 0) {
            const elapsed = Math.min(time - previousTime, 64) / 1000;
            offset = (offset + elapsed * distance / Math.max(18, originals.length * 3.4)) % distance;
            track.style.transform = `translate3d(${-offset}px, 0, 0)`;
            highlightCenter();
        }
        previousTime = time;
        frame = requestAnimationFrame(tick);
    };
    const pause = () => { paused = true; };
    const leaveFocus = event => { paused = carousel.contains(event.relatedTarget); };
    carousel.addEventListener('focusin', pause);
    carousel.addEventListener('focusout', leaveFocus);
    const observer = new ResizeObserver(measure);
    observer.observe(carousel);
    measure();
    frame = requestAnimationFrame(tick);
    return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        carousel.removeEventListener('focusin', pause);
        carousel.removeEventListener('focusout', leaveFocus);
        track.querySelectorAll('[data-carousel-clone]').forEach(card => card.remove());
        originals.forEach(card => card.classList.remove('is-center'));
        track.style.transform = '';
    };
};
