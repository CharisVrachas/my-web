// Ported from three separate blocks in the template's main.js:
//   13. portfolio-item-hover (service-item hover)  → the row → image swap
//   19. anim-zoomin + gallery isotope               → the thumb reveal-in
//   15. panel pin section (at-panel-pin)             → the image column pin
//
// The hover swap was already plain GSAP + DOM APIs, no jQuery, so it's a
// direct copy of the template's tween values — see the comment on it below
// for the one thing that had to be added (the explicit ease) and why. The
// only behavioural addition is a focus path the template never had (it
// listened for mouseenter only, so keyboard users could never see any image
// but the first).
//
// The pin is NOT `position: sticky`, even though the template's own version
// pinned via a GSAP tween with nothing on it to animate — which reads as
// "this is just sticky with extra steps." It isn't, here: this site runs
// ScrollSmoother (see core.js), and ScrollSmoother moves #smooth-content with
// a transform rather than real page scroll, which native position: sticky
// does not track — confirmed on this exact section, where the sticky version
// scrolled straight off screen instead of holding. ScrollTrigger's pin
// (below) is aware of the smoother and is what hero-stack.js/about-stack.js
// already use for every other pin on this page, for the same reason.
//
// The "40+" counter replaces odometer.js + jquery.appear with the same
// GSAP-tween-a-proxy-object technique preloader.js already uses for its own
// counter — one fewer dependency for the same job.
function initServices() {
	const DOM = {
		section: document.querySelector(".section_services"),
		media: document.querySelector(".services_media"),
		list: document.querySelector(".services_list"),
		items: document.querySelectorAll("[data-services-item]"),
		images: document.querySelectorAll("[data-services-image]"),
		thumbs: document.querySelectorAll(".services_item_thumb"),
		counter: document.querySelector("[data-services-counter]"),
	};

	if (!DOM.section) return;

	// Orisa's exact transition, values and all: the outgoing image drops 200px
	// and shrinks to 0.8 while the incoming one rides up to y:0 at full scale,
	// both over 0.8s. It is a vertical slide-and-scale, not a crossfade — an
	// earlier pass here used a CSS opacity/scale(1.08) fade, which is why it
	// looked close but never actually matched.
	//
	// The ease has to be stated explicitly. GSAP's own factory default is
	// power1.out, which is what the template inherits, but core.js sets
	// gsap.defaults({ ease: "none" }) site-wide — so leaving it off here would
	// silently make this the one linear tween on the page.
	const EASE = "power1.out";

	gsap.set(DOM.images, { opacity: 0, y: 50, scale: 1 });
	if (DOM.images[0]) gsap.set(DOM.images[0], { opacity: 1, y: 0, zIndex: 2 });

	function setActiveImage(index) {
		DOM.images.forEach((img, i) => {
			if (i === index) {
				gsap.to(img, { opacity: 1, y: 0, scale: 1, zIndex: 2, duration: 0.8, ease: EASE });
			} else {
				gsap.to(img, { opacity: 0, y: 200, scale: 0.8, zIndex: 1, duration: 0.8, ease: EASE });
			}
		});
	}

	// mouseenter, not mouseover: only fires once per row entry rather than on
	// every pixel of internal mouse movement, and focus covers keyboard/switch
	// users tabbing through the same rows.
	DOM.items.forEach((item, index) => {
		item.addEventListener("mouseenter", () => setActiveImage(index));
		item.addEventListener("focus", () => setActiveImage(index));
	});

	if (DOM.counter) {
		const target = Number(DOM.counter.dataset.count) || 0;
		const proxy = { value: 0 };

		ScrollTrigger.create({
			trigger: DOM.counter,
			start: "top 85%",
			once: true,
			onEnter: () => {
				gsap.to(proxy, {
					value: target,
					duration: 1.5,
					ease: "power2.out",
					onUpdate: () => {
						DOM.counter.textContent = String(Math.round(proxy.value));
					},
				});
			},
		});
	}

	// Each row's small thumb fades and un-scales in the first time it enters
	// the viewport — the template's .anim-zoomin, ported 1:1 in spirit
	// (start: "top 100%", scale 1.2 → 1, opacity 0 → 1) but as a `once`
	// ScrollTrigger instead of a jQuery-wrapped ScrollTrigger timeline.
	DOM.thumbs.forEach((thumb) => {
		gsap.from(thumb, {
			autoAlpha: 0,
			scale: 1.2,
			duration: 1.2,
			ease: "power2.out",
			scrollTrigger: {
				trigger: thumb,
				start: "top 100%",
				once: true,
			},
		});
	});

	// Only worth pinning where there's a taller sibling column to scroll past
	// — same 992px cutoff hero-stack.js/about-stack.js use elsewhere on this
	// page (the template gated its own version at 1199px; 992 is what the
	// rest of this codebase actually uses, so this follows that instead).
	if (DOM.media && DOM.list) {
		// ScrollTrigger's start/end strings take px or %, not rem — "top 9rem"
		// parses as if the unit weren't there at all (~9px, not the 144px
		// intended at the usual 16px root), which pinned the section right
		// under the fixed navbar instead of below it. Same rootFontSize()
		// conversion hero-stack.js already uses for its own GSAP values.
		const rootFontSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize);
		const mm = gsap.matchMedia();
		mm.add("(min-width: 992px)", () => {
			const trigger = ScrollTrigger.create({
				trigger: DOM.media,
				start: () => `top ${9 * rootFontSize()}`,
				// The classic sticky-sidebar formula: pin for exactly the
				// difference in height between the two columns, since that's how
				// far the taller one (the list) has left to scroll once the
				// shorter one (the media column) is fully in view. An
				// `endTrigger: list, end: "bottom bottom"` pair looks like the
				// obvious way to say "until the list finishes scrolling past," but
				// on THIS list (1086px) against a 900px viewport that end condition
				// is satisfied almost immediately — it measures against the
				// viewport's own height, not the two columns' height difference,
				// and produced a pin lasting all of 195px in testing.
				end: () => `+=${Math.max(0, DOM.list.offsetHeight - DOM.media.offsetHeight)}`,
				pin: true,
				// The list is what provides the scroll distance here; without this
				// ScrollTrigger would ALSO insert padding equal to the pinned
				// element's height, pushing everything below the section down by
				// that much for no reason.
				pinSpacing: false,
				invalidateOnRefresh: true,
			});
			return () => trigger.kill();
		});
	}
}
