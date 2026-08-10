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

	// Gated to desktop only now — mobile got a plain reveal instead (below).
	// The 25x/rotate-180 scrub was mapped to `badge`'s own untransformed
	// height (the 141px badge.svg, "top 60%" to "bottom 0%"): on desktop's
	// slower wheel-driven scroll that narrow window still renders enough
	// in-between frames to read as a zoom, but a phone's touch-flick can
	// cross that whole ~141px in one or two frames, or overshoot past
	// "end" entirely on the very gesture that was supposed to start it —
	// either way, whatever scale scrub happened to land on stays exactly
	// there since it never gets more scroll to keep resolving against. Not
	// stuck so much as never given the room to move on a phone in the
	// first place — same underlying cause as it sitting frozen mid-grown
	// ("κολλήσει... από πίσω") and as it never visibly starting at all
	// ("δεν κάνει το εφε"), depending where a given flick happened to land.
	// A narrow viewport can't be "swallowed" by scaling a 141px mark the
	// way a wide one can either — the badge would need an even bigger
	// multiple to cover a tall phone screen, so the effect doesn't really
	// translate down to this size regardless of the scroll-distance fix.
	if ((badge || badgeText) && !prefersReducedMotion) {
		gsap.matchMedia().add(
			{
				desktop: "(min-width: 768px)",
				mobile: "(max-width: 767px)",
			},
			(context) => {
				const { desktop } = context.conditions;
				const tweens = [];

				if (desktop) {
					if (badge) {
						tweens.push(
							gsap.to(badge, {
								scale: 25,
								rotation: 180,
								scrollTrigger: {
									trigger: badge,
									start: "top 60%",
									end: "bottom 0%",
									scrub: 1,
								},
							}),
						);
					}
					if (badgeText) {
						tweens.push(
							gsap.to(badgeText, {
								scale: 8,
								scrollTrigger: {
									trigger: badgeText,
									start: "top 70%",
									end: "bottom 0%",
									scrub: 1,
								},
							}),
						);
					}
				} else if (badge) {
					// One guaranteed, non-scrubbed arrival — plays fully in a fixed
					// 0.9s regardless of how fast the scroll gesture that triggered
					// it was, the same `once: true` technique services.js's own
					// mobile row-reveal uses for exactly this reason.
					tweens.push(
						gsap.from(badge, {
							scale: 0.75,
							opacity: 0,
							duration: 0.9,
							ease: "power2.out",
							scrollTrigger: {
								trigger: badge,
								start: "top 90%",
								once: true,
							},
						}),
					);
				}

				return () => {
					tweens.forEach((tween) => {
						tween.scrollTrigger?.kill();
						tween.kill();
					});
					gsap.set([badge, badgeText].filter(Boolean), { clearProps: "all" });
				};
			},
		);
	}
}
