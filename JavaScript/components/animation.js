
document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    // ═══════════════════════════════════════════
    // HERO — Title letter by letter
    // ═══════════════════════════════════════════
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
        const lines = heroTitle.querySelectorAll('.hero-title-line');
        const targets = lines.length ? lines : [heroTitle];

        targets.forEach(target => {
            const text = target.textContent.trim();
            target.innerHTML = '';

            text.split(' ').forEach((word, wordIndex) => {
                if (wordIndex > 0) {
                    target.appendChild(document.createTextNode(' '));
                }

                const wordSpan = document.createElement('span');
                wordSpan.className = 'hero-title-word';
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'nowrap';

                word.split('').forEach(char => {
                    const span = document.createElement('span');
                    span.className = 'hero-title-char';
                    span.textContent = char;
                    span.style.display = 'inline-block';
                    span.style.opacity = '0';
                    span.style.transform = 'translateY(-60px)';
                    wordSpan.appendChild(span);
                });

                target.appendChild(wordSpan);
            });
        });

        gsap.to(heroTitle.querySelectorAll('.hero-title-char'), {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.04,
            ease: 'back.out(1.2)',
            delay: 0.3,
        });
    }

    gsap.to('#hero-kicker', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay: 0.15,
        ease: 'power2.out',
    });

    // Hero subtitle
    gsap.to('#hero-subtitle', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.2,
        ease: 'power2.out',
    });

    // Hero CTA
    gsap.to('#hero-cta', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 1.5,
        ease: 'power2.out',
    });

    // ═══════════════════════════════════════════
    // SPEED LINES — strokeDashoffset animation
    // ═══════════════════════════════════════════
    const speedLines = document.querySelectorAll('.speed-line');
    if (speedLines.length) {
        gsap.to(speedLines, {
            strokeDashoffset: 0,
            opacity: 1,
            duration: 1.5,
            stagger: 0.03,
            ease: 'power2.inOut',
            delay: 0.5,
        });
    }

    // ═══════════════════════════════════════════
    // SERVICE CARDS — Clip-path reveal on scroll
    // ═══════════════════════════════════════════
    gsap.utils.toArray('.service-card').forEach((card, i) => {
        gsap.to(card, {
            clipPath: 'inset(0 0 0% 0)',
            duration: 0.8,
            ease: 'power3.out',
            delay: i * 0.15,
            scrollTrigger: {
                trigger: card,
                start: 'top 80%',
                toggleActions: 'play none none none',
            },
        });
    });

    // ═══════════════════════════════════════════
    // SECTION TITLES — Fade in
    // ═══════════════════════════════════════════
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            opacity: 0,
            y: 40,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: title,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
        });
    });

    // ═══════════════════════════════════════════
    // TIMELINE STEPS — Stagger reveal
    // ═══════════════════════════════════════════
    gsap.utils.toArray('.timeline-step').forEach((step, i) => {
        gsap.from(step, {
            opacity: 0,
            x: i % 2 === 0 ? -60 : 60,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: step,
                start: 'top 80%',
                toggleActions: 'play none none none',
            },
        });
    });

    // ═══════════════════════════════════════════
    // INSTRUCTOR — Asymmetric reveal
    // ═══════════════════════════════════════════
    // LEARNING CAROUSEL - Continuous center highlight
    const learningCarousel = document.querySelector('.learning-carousel');
    if (learningCarousel) {
        const track = learningCarousel.querySelector('.learning-carousel-track');
        const originalCards = track ? Array.from(track.querySelectorAll('.learning-carousel-card')) : [];

        const stopPendingLink = event => {
            const href = event.currentTarget.getAttribute('href');
            if (!href || href.trim() === '#') {
                event.preventDefault();
            }
        };

        originalCards.forEach(card => card.addEventListener('click', stopPendingLink));

        if (track && originalCards.length) {
            originalCards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                clone.setAttribute('tabindex', '-1');
                clone.addEventListener('click', stopPendingLink);
                track.appendChild(clone);
            });

            const cards = Array.from(track.querySelectorAll('.learning-carousel-card'));
            let carouselTween = null;
            let resizeTimer = null;

            const setCenterCard = () => {
                const carouselRect = learningCarousel.getBoundingClientRect();
                const carouselCenter = carouselRect.left + carouselRect.width / 2;
                let closestCard = null;
                let closestDistance = Infinity;

                cards.forEach(card => {
                    const cardRect = card.getBoundingClientRect();
                    const cardCenter = cardRect.left + cardRect.width / 2;
                    const distance = Math.abs(carouselCenter - cardCenter);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestCard = card;
                    }
                });

                cards.forEach(card => {
                    card.classList.toggle('is-center', card === closestCard);
                });
            };

            const getCycleDistance = () => {
                const firstCard = originalCards[0];
                const lastCard = originalCards[originalCards.length - 1];
                const trackStyle = window.getComputedStyle(track);
                const gap = parseFloat(trackStyle.columnGap || trackStyle.gap) || 0;
                return lastCard.offsetLeft + lastCard.offsetWidth - firstCard.offsetLeft + gap;
            };

            const buildCarouselTween = () => {
                if (carouselTween) {
                    carouselTween.kill();
                }

                gsap.set(track, { x: 0 });
                const distance = getCycleDistance();

                carouselTween = gsap.to(track, {
                    x: -distance,
                    duration: Math.max(18, originalCards.length * 3.4),
                    ease: 'none',
                    repeat: -1,
                    onUpdate: setCenterCard,
                });

                setCenterCard();
            };

            buildCarouselTween();

            window.addEventListener('resize', () => {
                window.clearTimeout(resizeTimer);
                resizeTimer = window.setTimeout(buildCarouselTween, 180);
            });
        }
    }

    gsap.from('.instructor-visual', {
        opacity: 0,
        x: -80,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '#instructor',
            start: 'top 70%',
            toggleActions: 'play none none none',
        },
    });

    gsap.from('.instructor-info', {
        opacity: 0,
        x: 80,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: {
            trigger: '#instructor',
            start: 'top 70%',
            toggleActions: 'play none none none',
        },
    });

    // ═══════════════════════════════════════════
    // TESTIMONIAL CARDS — Stagger
    // ═══════════════════════════════════════════
    gsap.utils.toArray('.testimonial-card').forEach((card, i) => {
        gsap.from(card, {
            opacity: 0,
            y: 40,
            duration: 0.6,
            delay: i * 0.1,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '#testimonios',
                start: 'top 70%',
                toggleActions: 'play none none none',
            },
        });
    });

    // ═══════════════════════════════════════════
    // PLAN CARDS — Stagger
    // ═══════════════════════════════════════════
    gsap.utils.toArray('.plan-card').forEach((card, i) => {
        gsap.from(card, {
            opacity: 0,
            y: 60,
            duration: 0.7,
            delay: i * 0.15,
            ease: 'back.out(1.1)',
            scrollTrigger: {
                trigger: '#precios',
                start: 'top 70%',
                toggleActions: 'play none none none',
            },
        });
    });

    // ═══════════════════════════════════════════
    // FAQ ITEMS — Stagger
    // ═══════════════════════════════════════════
    gsap.utils.toArray('.faq-item').forEach((item, i) => {
        gsap.from(item, {
            opacity: 0,
            y: 30,
            duration: 0.5,
            delay: i * 0.08,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: '#faq',
                start: 'top 75%',
                toggleActions: 'play none none none',
            },
        });
    });
});
