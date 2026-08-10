// Ported from three blocks of Orisa's main.js:
//   47. customSwiper / slider-testimonial  → the slider itself
//   49. scroll-move-up2 animation          → the block rising into view
//   50. zoom-in-full (badge-zoon-in)       → the badge swallowing the screen
//
// Every value is Orisa's: 4 slides per view stepping down to 1, 35px between
// them, centred, looping, 5s autoplay; the rise is y:80 → 0 scrubbed over the
// block's own approach; the badge goes to scale 25 / rotation 180 while its
// label goes to scale 8, both scrubbed.
//
// The one addition is the reduced-motion guard on the badge. At scale 25 that
// mark covers the entire viewport and spins — it is the most aggressive thing
// on the page, and it is pure decoration, so it comes off when the OS asks
// for less movement. Orisa has no such guard.
function initTestimonials() {
	const section = document.querySelector(".section_testimonials");
	if (!section) return;

	const sliderEl = section.querySelector("[data-testimonials-slider]");

	if (sliderEl && typeof Swiper !== "undefined") {
		new Swiper(sliderEl, {
			slidesPerView: 4,
			spaceBetween: 35,
			slidesPerGroup: 1,
			centeredSlides: true,
			loop: true,
			autoplay: {
				delay: 5000,
			},
			breakpoints: {
				1200: { slidesPerView: 3 },
				992: { slidesPerView: 2 },
				768: { slidesPerView: 1 },
				576: { slidesPerView: 1 },
				0: { slidesPerView: 1 },
			},
			navigation: {
				nextEl: section.querySelector("[data-testimonials-next]"),
				prevEl: section.querySelector("[data-testimonials-prev]"),
			},
		});
	}

	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// Orisa gates this at 768px up — on a phone the block is already most of
	// the screen, so an 80px rise reads as the page jerking rather than as
	// anything arriving.
	const rise = section.querySelector("[data-testimonials-rise]");
	if (rise && !prefersReducedMotion) {
		gsap.matchMedia().add("(min-width: 768px)", () => {
			const tween = gsap.from(rise, {
				y: 80,
				opacity: 0,
				ease: "power4.out",
				scrollTrigger: {
					trigger: rise,
					start: "top bottom",
					end: "bottom bottom",
					scrub: 1,
				},
			});
			return () => {
				tween.scrollTrigger?.kill();
				tween.kill();
				gsap.set(rise, { clearProps: "transform,opacity" });
			};
		});
	}

	const badge = section.querySelector("[data-testimonials-badge]");
	const badgeText = section.querySelector("[data-testimonials-badge-text]");
	if (badge && !prefersReducedMotion) {
		gsap.to(badge, {
			scale: 25,
			rotation: 180,
			scrollTrigger: {
				trigger: badge,
				start: "top 60%",
				end: "bottom 0%",
				scrub: 1,
			},
		});
	}
	if (badgeText && !prefersReducedMotion) {
		gsap.to(badgeText, {
			scale: 8,
			scrollTrigger: {
				trigger: badgeText,
				start: "top 70%",
				end: "bottom 0%",
				scrub: 1,
			},
		});
	}
}
