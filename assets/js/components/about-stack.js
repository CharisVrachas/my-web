function initAbout() {
	const DOM = {
		about: document.querySelector(".section_about"),
		pillars: document.querySelector(".section_pillars"),
		history: document.querySelector(".section_history"),
		aboutBg: document.querySelector(".about_bg"),
		aboutOverlay: document.querySelector(".about_overlay"),
		filmsOverlay: document.querySelector(".films_overlay"),
		pillarsWrapper: document.querySelector(".pillars_wrapper"),
		pillarsBgs: document.querySelectorAll(".pillars_bg"),
		pillarsGlow: document.querySelector(".pillars_glow"),
		filmImgs: document.querySelectorAll(".film_img"),
		aboutDecor: document.querySelector(".about_decor"),
	};

	if (!DOM.about || !DOM.pillars) return;

	const splitPillars = new SplitText("[data-heading-pillars]", {
		types: "lines",
		linesClass: "pillar-line",
	});

	const maskAboutState = { w: window.innerWidth, h: window.innerHeight };
	const maskPillarsState = { w: window.innerWidth, h: 0 };

	const getClipPath = (w, h, type) => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const rx = vw / 2 - w / 2;
		const ry = type === "about" ? 0 : vh - h;
		return `polygon(${rx}px ${ry}px, ${rx + w}px ${ry}px, ${rx + w}px ${ry + h}px, ${rx}px ${ry + h}px)`;
	};

	const updateAboutMask = () => {
		DOM.about.style.clipPath = DOM.about.style.webkitClipPath = getClipPath(
			maskAboutState.w,
			maskAboutState.h,
			"about",
		);
	};

	const updatePillarsMask = () => {
		DOM.pillars.style.clipPath = DOM.pillars.style.webkitClipPath = getClipPath(
			maskPillarsState.w,
			maskPillarsState.h,
			"pillars",
		);
	};

	const mm = gsap.matchMedia();

	mm.add(
		{
			desktop: "(min-width: 992px)",
			mobile: "(max-width: 991px)",
		},
		(context) => {
			let { desktop, mobile } = context.conditions;

			if (desktop) {
				gsap.set([DOM.about, DOM.pillars], {
					clearProps: "maskImage, webkitMaskImage, clipPath, webkitClipPath",
				});

				updateAboutMask();
				updatePillarsMask();

				const aboutWrapper = document.querySelector(".about_stack_wrapper");
				let tl = gsap.timeline({
					scrollTrigger: {
						trigger: aboutWrapper,
						start: "top top",
						end: "+=300%",
						pin: true,
						scrub: true,
						invalidateOnRefresh: true,
						anticipatePin: 1,
					},
				});

				DOM.filmImgs.forEach((img) => {
					gsap.to(img, {
						yPercent: 25,
						scrollTrigger: {
							trigger: DOM.about,
							start: "top-=100% top",
							end: "top top",
							scrub: true,
						},
					});
				});

				gsap.to(DOM.filmsOverlay, {
					opacity: 1,
					scrollTrigger: {
						trigger: DOM.about,
						start: "top-=100% top",
						end: "top top",
						scrub: true,
					},
				});

				tl.to(DOM.aboutBg, { yPercent: -50, scale: "0.91", duration: 1 }, 0)
					.to(DOM.aboutOverlay, { opacity: 1, duration: 1 }, 1)
					.to(maskAboutState, { h: 0, duration: 1, onUpdate: updateAboutMask }, 1)
					.to(
						maskPillarsState,
						{ h: () => window.innerHeight + 20, duration: 1, onUpdate: updatePillarsMask },
						1,
					);

				// These three hung off .section_history, which does not exist. They cannot hang
				// off aboutWrapper either: it is pinned, so its top never travels past the top
				// of the viewport and an offset start never fires — which left the headings
				// parked below their masks and the copy at opacity 0. While the pin is running
				// the timeline is the only thing mapping scroll to progress, so the reveals
				// belong inside it. Positions 1 to 2 are where the pillars mask opens.
				//
				// The pillarsBgs yPercent:25 parallax (originally a fourth item here) does NOT
				// belong in this group: in the source it scrubs against .section_history's own
				// approach ("top-=innerHeight top-=1" to "top top"), i.e. it only starts moving
				// once you scroll toward History, well after this pin is done. Folding it into
				// position 1-2 here made it complete at full strength the moment Pillars finishes
				// revealing — permanently shifting the 100%-tall video down 25% of its own height
				// with nothing behind it, which reads as a torn-off band across the top of the
				// section. Left out until History exists to give it a real, separate trigger.
				document.querySelectorAll("[data-heading-pillars]").forEach((head) => {
					tl.from(
						head.querySelectorAll(".pillar-line"),
						{ yPercent: 100, duration: 0.6, ease: "power4.inOut" },
						1.25,
					);
				});

				// gsap.set() + tl.to(), not tl.from() — .from() captures whatever
				// the element's opacity computes to AT THE MOMENT this runs as the
				// implicit target it animates back to, not a guaranteed 1. That's
				// almost always the same thing, which is why this worked for the
				// four interlaced paragraphs, but .pillars_fifth_body (added to
				// this same selector once .pillars_fifth got its own
				// data-body-pillars, Pillars.astro) still came out permanently
				// invisible — its heading revealed correctly, only the paragraph
				// stayed blank. Setting the start state explicitly and animating
				// TO an explicit 1 removes that ambiguity for every paragraph
				// here, the fifth included, rather than relying on whatever was
				// true of the DOM at construction time.
				document.querySelectorAll("[data-body-pillars] p").forEach((p) => {
					gsap.set(p, { opacity: 0 });
					tl.to(p, { opacity: 1, duration: 0.55, ease: "power4.inOut" }, 1.45);
				});

				tl.fromTo(
					DOM.pillarsWrapper,
					{ pointerEvents: "none" },
					{ pointerEvents: "auto", duration: 0 },
					1.6,
				);

				// Purely decorative drift behind the pillars content. Has to live
				// inside this same timeline, not its own ScrollTrigger: while
				// aboutWrapper is pinned, real scrollY barely advances — wheel input
				// is being converted into this timeline's progress instead, so
				// anything meant to move "on scroll" here has to be a tween of tl,
				// not a separately-triggered animation. Spans 1→2, the same window
				// the pillars mask opens over, so it only moves while pillars is
				// actually on screen.
				tl.to(DOM.pillarsGlow, { x: "9vw", y: "7vw", duration: 1, ease: "none" }, 1);

				gsap.fromTo(
					DOM.aboutDecor,
					{ opacity: 0, yPercent: 25 },
					{
						opacity: 1,
						yPercent: 0,
						duration: 1,
						ease: "power4.out",
						scrollTrigger: {
							trigger: DOM.aboutDecor,
							start: "top 81%",
							toggleActions: "play none none reverse",
						},
					},
				);
			}

			if (mobile) {
				gsap.set([DOM.about, DOM.pillars], {
					maskImage: "none",
					webkitMaskImage: "none",
					clipPath: "none",
					webkitClipPath: "none",
				});

				DOM.filmImgs.forEach((img) => {
					gsap.fromTo(
						img,
						{ yPercent: -20 },
						{
							yPercent: 0,
							scrollTrigger: {
								trigger: DOM.about,
								start: "top-=100% top",
								end: "top top",
								scrub: true,
							},
						},
					);
				});

				gsap.fromTo(
					DOM.aboutBg,
					{ yPercent: -5 },
					{
						yPercent: 5,
						scrollTrigger: {
							trigger: DOM.about,
							start: "top bottom",
							end: "bottom top",
							scrub: true,
						},
					},
				);

				DOM.pillarsBgs.forEach((img) => {
					gsap.fromTo(
						img,
						{ yPercent: -20 },
						{
							yPercent: 20,
							scrollTrigger: {
								trigger: DOM.pillars,
								start: "top bottom",
								end: "bottom top",
								scrub: true,
							},
						},
					);
				});

				// No pin on mobile, so — unlike the desktop tween in the pinned
				// timeline above — this section actually scrolls, and can use its
				// own ScrollTrigger directly. Same trigger/scrub as the .pillars_bg
				// parallax just above.
				gsap.fromTo(
					DOM.pillarsGlow,
					{ x: "-5vw", y: "-4vw" },
					{
						x: "5vw",
						y: "4vw",
						scrollTrigger: {
							trigger: DOM.pillars,
							start: "top bottom",
							end: "bottom top",
							scrub: true,
						},
					},
				);

				gsap.fromTo(
					DOM.aboutDecor,
					{ opacity: 0, yPercent: 25 },
					{
						opacity: 1,
						yPercent: 0,
						duration: 1,
						ease: "power4.out",
						scrollTrigger: {
							trigger: DOM.aboutDecor,
							start: "top 81%",
							toggleActions: "play none none reverse",
						},
					},
				);

				// trigger: head/p itself, not DOM.pillars (the whole, tall section)
				// — that was the bug. "top bottom" against the SECTION fires the
				// instant its first pixel appears at the very bottom edge of the
				// screen, which for a section this tall is well before any of its
				// five rows have scrolled anywhere near readable — every heading
				// and paragraph on the page fired together, in one burst, long
				// before there was anything to watch: technically present, but
				// timed to finish before the user could ever see it happen, which
                // is indistinguishable from "no effect" ("θέλω να έχει το εφέ...
                // όπως στο desktop"). Triggering off each row's OWN element with
                // "top 85%" is what Services/WhyUs's mobile passes already settled
                // on for the same reason — each row animates in as IT actually
                // scrolls into view, not all five at once off a trigger point
                // none of them individually sit near.
				document.querySelectorAll("[data-heading-pillars]").forEach((head) => {
					gsap.from(head.querySelectorAll(".pillar-line"), {
						yPercent: 110,
						duration: 1,
						ease: "power4.inOut",
						scrollTrigger: {
							trigger: head,
							start: "top 85%",
							toggleActions: "play none none reverse",
						},
					});
				});

				// Same gsap.set()+.to() swap as the desktop path above, same reason.
				document.querySelectorAll("[data-body-pillars] p").forEach((p) => {
					gsap.set(p, { opacity: 0 });
					gsap.to(p, {
						opacity: 1,
						duration: 1,
						ease: "power4.inOut",
						scrollTrigger: {
							trigger: p,
							start: "top 90%",
							toggleActions: "play none none reverse",
						},
					});
				});
			}
		},
	);
}
