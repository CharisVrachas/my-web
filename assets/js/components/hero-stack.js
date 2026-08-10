function initHero() {
	const DOM = {
		hero: document.querySelector(".section_hero"),
		bg: document.querySelector(".hero_bg"),
		headingMain: document.querySelector('[data-hero-heading="main"]'),
		headingFirst: document.querySelector(".hero_heading_first"),
		headingThird: document.querySelector(".hero_heading_third"),
		decorFirst: document.querySelector(".hero_decor.first"),
		decorSecond: document.querySelector(".hero_decor.second"),
		overlay: document.querySelector(".hero_overlay"),
		vvContentFirst: document.querySelector('[data-vv="1"]'),
		vvContentSecond: document.querySelector('[data-vv="2"]'),
		filmFirst: document.querySelector('[data-film="1"]'),
		filmSecond: document.querySelector('[data-film="2"]'),
		headingFilms: document.querySelectorAll("[data-heading-films]"),
		bodyFilms: document.querySelectorAll("[data-body-films]"),
	};

	if (!DOM.hero) return;

	const maskState = { w: window.innerWidth, h: window.innerHeight };
	const filmFirstMaskState = { w: window.innerWidth, h: 0 };
	const filmSecondMaskState = { w: window.innerWidth, h: 0 };

	const getClipPath = (w, h, type) => {
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const rx = vw / 2 - w / 2;
		let ry = vh / 2 - h / 2;
		if (type === "top") ry = 0 - 1;
		if (type === "bottom") ry = vh - h + 1;
		return `polygon(${rx - 1}px ${ry - 1}px, ${rx + w + 1}px ${ry - 1}px, ${rx + w + 1}px ${ry + h + 1}px, ${rx - 1}px ${ry + h + 1}px)`;
	};

	const updateAllMasks = () => {
		DOM.hero.style.clipPath = getClipPath(maskState.w, maskState.h, "center");
		if (DOM.filmFirst)
			DOM.filmFirst.style.clipPath = getClipPath(filmFirstMaskState.w, filmFirstMaskState.h, "top");
		if (DOM.filmSecond)
			DOM.filmSecond.style.clipPath = getClipPath(
				filmSecondMaskState.w,
				filmSecondMaskState.h,
				"bottom",
			);
	};

	const rootFontSize = () => parseFloat(getComputedStyle(document.documentElement).fontSize);

	// The definition headings are single unbreakable words rendered at 6rem, so
	// they can be wider than the fixed .vv_content column and spill past its box.
	// The left block is positioned by its RIGHT edge, so it must be measured by
	// the painted text — measuring the box alone under-reports the width and lets
	// the first word collide with the second at the end of the scroll.
	const paintedWidth = (el) => {
		if (!el) return 0;
		const box = el.getBoundingClientRect().width;
		const heading = el.querySelector(".u-h2-feature");
		if (!heading) return box;
		const range = document.createRange();
		range.selectNodeContents(heading);
		return Math.max(box, range.getBoundingClientRect().width);
	};

	// Both blocks land 2rem either side of the centre line. The 8rem covers the
	// container's 2rem padding on each side plus the 4rem gap between them.
	// The right block is positioned by its LEFT edge, which is the box edge, so
	// its box width is the correct measurement there.
	const getVvRes1 = () =>
		(window.innerWidth - 8 * rootFontSize()) / 2 - paintedWidth(DOM.vvContentFirst);
	const getVvRes2 = () =>
		(window.innerWidth - 8 * rootFontSize()) / 2 -
		(DOM.vvContentSecond?.getBoundingClientRect().width ?? 0);

	if (DOM.headingFilms.length) {
		new SplitText(DOM.headingFilms, { types: "lines", mask: "lines", linesClass: "line" });
		gsap.set("[data-heading-films] .line-mask", { width: "100%" });
		// Must match .film_heading in films.css — SplitText rebuilds the heading
		// into .line wrappers and this overwrites whatever the stylesheet set.
		gsap.set("[data-heading-films] .line", {
			display: "inline-flex",
			justifyContent: "center",
			width: "100%",
		});

		DOM.headingFilms.forEach((el) => {
			gsap.set(el.querySelectorAll(".line"), { yPercent: 100, opacity: 0 });
			const a = gsap.fromTo(
				el.querySelectorAll(".line"),
				{ yPercent: 100, opacity: 0 },
				{
					yPercent: 0,
					opacity: 1,
					ease: "power4.inOut",
					duration: 0.8,
					stagger: 0.05,
					paused: true,
				},
			);
			ScrollTrigger.create({
				trigger: ".section_about",
				start: "top-=175% top",
				onEnter: () => a.play(),
				onLeaveBack: () => a.reverse(),
			});
		});
	}

	DOM.bodyFilms.forEach((el) => {
		gsap.set(el, { opacity: 0 });
		const a = gsap.fromTo(
			el,
			{ opacity: 0 },
			{ opacity: 1, ease: "power4.inOut", duration: 1.5, delay: 0.5, paused: true },
		);
		ScrollTrigger.create({
			trigger: ".section_about",
			start: "top-=175% top",
			onEnter: () => a.play(),
			onLeaveBack: () => a.reverse(),
		});
	});

	const wrapper = document.querySelector(".hero_stack_wrapper");
	const mm = gsap.matchMedia();

	mm.add(
		{
			desktop: "(min-width: 992px)",
			mobile: "(max-width: 991px)",
		},
		(context) => {
			const { desktop: isDesktop } = context.conditions;

			updateAllMasks();

			const scrollTriggerConfig = {
				trigger: wrapper,
				start: "top top",
				end: "+=400%",
				pin: true,
				scrub: true,
				invalidateOnRefresh: true,
			};

			let tl;

			if (isDesktop) {
				tl = gsap.timeline({
					onUpdate: updateAllMasks,
					scrollTrigger: {
						...scrollTriggerConfig,
						onRefresh: (self) => self.animation.progress(self.progress),
					},
				});

				tl.to(maskState, { duration: 1, w: 61 }, 0)
					.to(DOM.bg, { duration: 1, scale: 1 }, 0)
					.to(DOM.headingMain, { duration: 0.98, opacity: 0 }, 0.02)
					.to([DOM.headingFirst, DOM.decorFirst], { duration: 0.98, x: 100 }, 0.02)
					.to([DOM.headingThird, DOM.decorSecond], { duration: 0.98, x: -100 }, 0.02)
					.to([DOM.decorFirst, DOM.decorSecond], { opacity: 0 }, 0.02)
					.to(DOM.hero, { duration: 1, rotation: 80 }, 1)
					.to(DOM.hero, { duration: 1, scale: 0 }, 2)
					.to(DOM.overlay, { duration: 0.5, opacity: 1 }, "<")
					.to(DOM.vvContentFirst, { duration: 1, x: getVvRes1 }, "<")
					.to(DOM.vvContentSecond, { duration: 1, x: () => -getVvRes2() }, "<")
					.to(filmFirstMaskState, { duration: 1, h: () => window.innerHeight + 10 }, 3)
					.to(filmSecondMaskState, { duration: 1, h: () => window.innerHeight + 10 }, "<")
					.fromTo(
						[DOM.filmFirst, DOM.filmSecond],
						{ pointerEvents: "none" },
						{ pointerEvents: "auto", duration: 0 },
						4,
					)
					.to(filmSecondMaskState, { duration: 1 }, 4);
			} else {
				tl = gsap.timeline({
					onUpdate: updateAllMasks,
					scrollTrigger: scrollTriggerConfig,
				});

				tl.to(maskState, { duration: 1, w: 24, h: 320 }, 0)
					.to(DOM.bg, { duration: 1, scale: 1 }, 0)
					.to(DOM.headingMain, { duration: 0.98, opacity: 0 }, 0.02)
					.to([DOM.headingFirst, DOM.decorFirst], { duration: 0.98, x: 10 }, 0.02)
					.to([DOM.headingThird, DOM.decorSecond], { duration: 0.98, x: -10 }, 0.02)
					.to([DOM.decorFirst, DOM.decorSecond], { opacity: 0 }, 0.02)
					.to(DOM.hero, { duration: 1, rotation: 80 }, 1)
					.to(DOM.hero, { duration: 1, scale: 0 }, 2)
					.to(DOM.overlay, { duration: 0.5, opacity: 1 }, "<")
					.to(filmFirstMaskState, { duration: 1, h: () => window.innerHeight / 2 + 1 }, 3)
					.fromTo(
						filmSecondMaskState,
						{ h: () => window.innerHeight / 2 - 1 },
						{ duration: 1, h: () => window.innerHeight + 1 },
						"<",
					)
					.fromTo(
						[DOM.filmFirst, DOM.filmSecond],
						{ pointerEvents: "none" },
						{ pointerEvents: "auto", duration: 0 },
						4,
					)
					.to(filmSecondMaskState, { duration: 1 }, 4);
			}

			return () => tl?.kill();
		},
	);
}
