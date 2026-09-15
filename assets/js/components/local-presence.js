// "Local presence in Chania" (LocalPresence.astro) — the two scroll effects
// Orisa's about-1 "Our Journey" block carries, from main.js:
//   20. scale-img-from-to — the photo scrubs from scale 1.5 down to 1 while it
//       crosses the viewport (data-value-1="1.5" data-value-2="1" in Orisa).
//   48. scroll-move-up — each list row drifts up 100px, scrubbed, from the
//       moment its top reaches 70% of the viewport.
// The heading's character scrub and the CTA's fade are reveal.js's generic
// [data-reveal-text] / [data-fade-anim], same as everywhere else.
function initLocalPresence() {
	const section = document.querySelector("[data-local]");
	if (!section) return;
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

	const photo = section.querySelector("[data-local-scale]");
	if (photo) {
		gsap.fromTo(
			photo,
			{ scale: 1.5, ease: "sine" },
			{ scale: 1, scrollTrigger: { trigger: photo, scrub: true } },
		);
	}

	// Orisa's 100px on desktop. Below 992px the list sits straight under the
	// photo card with only a 3rem gap, and a 100px drift pulled the first row up
	// over the card's name bar — 40px keeps the effect without the collision.
	const items = section.querySelectorAll("[data-local-item]");
	gsap.matchMedia().add({ desktop: "(min-width: 992px)", mobile: "(max-width: 991px)" }, (context) => {
		const distance = context.conditions.desktop ? -100 : -40;
		items.forEach((item) => {
			gsap.to(item, {
				y: distance,
				scrollTrigger: { trigger: item, start: "top 70%", scrub: 1 },
			});
		});
	});
}
