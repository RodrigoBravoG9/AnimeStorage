const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup(count = 3) {
    const listeners = {};
    const carousel = {
        clientWidth: 1200,
        getBoundingClientRect: () => ({ left: 0, width: 1200 }),
        addEventListener: (name, fn) => listeners[name] = fn,
        removeEventListener: name => delete listeners[name],
        matches: () => false,
        contains: () => false
    };
    const track = {
        parentElement: carousel, children: [], style: {},
        append(card) { card.parent = this; this.children.push(card); },
        querySelectorAll() { return this.children.filter(c => 'carouselClone' in c.dataset); }
    };
    function card() {
        const names = new Set(['learning-carousel-card']);
        const node = {
            dataset: {}, parent: track, offsetWidth: 200,
            get offsetLeft() { return this.parent.children.indexOf(this) * 220; },
            classList: { contains: n => names.has(n), remove: n => names.delete(n), toggle: (n, yes) => yes ? names.add(n) : names.delete(n) },
            cloneNode: () => card(), setAttribute() {},
            remove() { this.parent.children = this.parent.children.filter(c => c !== this); }
        };
        return node;
    }
    for (let i = 0; i < count; i++) track.append(card());
    let nextFrame, measure, disconnected = false, canceled = false;
    const context = vm.createContext({ window: {}, document: { activeElement: null }, getComputedStyle: () => ({ columnGap: '20px' }),
        requestAnimationFrame: fn => { nextFrame = fn; return 1; }, cancelAnimationFrame: () => canceled = true,
        ResizeObserver: class { constructor(fn) { measure = fn; } observe() {} disconnect() { disconnected = true; } }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../JavaScript/components/animation.js'), 'utf8'), context);
    const stop = context.window.animateLearningCarousel(track);
    return { track, listeners, stop, tick: t => nextFrame(t), resize: () => measure(), stopped: () => canceled && disconnected };
}
test('carousel moves continuously and marks a center card', () => {
    const c = setup(); c.tick(0); c.tick(16);
    assert.notEqual(c.track.style.transform, 'translate3d(0px, 0, 0)');
    assert.equal(c.track.children.filter(n => n.classList.contains('is-center')).length, 1);
    for (let i = 2; i < 2000; i++) c.tick(i * 16);
    const offset = Math.abs(parseFloat(c.track.style.transform.match(/\((-?[\d.]+)/)[1]));
    assert.ok(offset < 660, 'offset wraps at the width of the original sequence');
});
test('one anime fills a wide screen and resize does not accumulate clones', () => {
    const c = setup(1); const length = c.track.children.length;
    assert.ok(length * 220 > 1200);
    c.resize(); c.resize(); assert.equal(c.track.children.length, length);
    assert.ok(c.track.children.slice(1).every(n => n.tabIndex === -1));
});
test('hover keeps moving, keyboard focus pauses, and rebuilding cleans up', () => {
    const c = setup(); c.tick(0); c.tick(16);
    c.listeners.mouseenter?.(); const beforeHover = c.track.style.transform; c.tick(32);
    assert.notEqual(c.track.style.transform, beforeHover);
    c.listeners.mouseleave?.(); c.tick(48);
    c.listeners.focusin(); const focused = c.track.style.transform; c.tick(64);
    assert.equal(c.track.style.transform, focused);
    c.listeners.focusout({ relatedTarget: null }); c.tick(80);
    assert.notEqual(c.track.style.transform, focused);
    c.stop(); assert.ok(c.stopped()); assert.equal(c.track.children.length, 3);
    assert.equal(Object.keys(c.listeners).length, 0);
});
test('empty catalog starts no animation', () => {
    const c = setup(0); assert.equal(c.track.children.length, 0); c.stop();
});
