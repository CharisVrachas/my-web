// Replays the preloader as an exit transition when navigating to another page
// of the same site. Single-page as shipped, so this only fires once you add
// real internal links (film case studies, privacy policy, …).
function initPageTransition() {
	const preloader = document.querySelector(".u-preloader");
	if (!preloader) return;
	const bg = document.querySelector(".preloader_bg");
	function runExitPreloader(callback) {
		gsap.set(preloader, {
			display: "flex",
			opacity: 0,
		});
		gsap.set(bg, { clipPath: "none" });
		gsap.to(preloader, {
			opacity: 1,
			duration: 0.6,
			ease: "power4.inOut",
			onComplete: () => {
				if (callback) callback();
			},
		});
	}
	document.querySelectorAll("a").forEach((link) => {
		link.addEventListener("click", function (e) {
			const href = link.getAttribute("href");
			if (
				!href ||
				href.startsWith("#") ||
				link.target === "_blank" ||
				link.hostname !== location.hostname ||
				link.hasAttribute("data-no-preloader")
			)
				return;
			e.preventDefault();
			runExitPreloader(() => {
				window.location.href = href;
			});
		});
	});
}

function initPreloader() {
	const preloader = document.querySelector(".u-preloader");
	if (!preloader) return;

	window.smootherReady.then(() => {
		const DOM = {
			bg: document.querySelector(".preloader_bg"),
			text: document.querySelector("[data-preloader-text]"),
			counter: document.querySelector("[data-counter]"),
			loader: document.querySelector(".preloader_loader"),
			loaderFill: document.querySelector(".preloader_loader_fill"),
			navbar: document.querySelector(".u-navbar"),
			heroChildren: document.querySelector(".hero_wrapper")?.children ?? [],
		};

		const isSmoother = () => !!window.smoother;

		if (isSmoother()) window.smoother.paused(true);

		// Always the full loader — no sessionStorage "hasVisited" gate. That
		// gate used to skip straight to a quick fade on every load after the
		// first in a tab, which is why a plain refresh stopped showing the
		// counter/animation at all (only a fresh incognito window, with its
		// own empty sessionStorage, ever saw it): sessionStorage survives
		// refreshes, it only clears when the tab itself closes. Wanted every
		// time, so the branch that read/wrote it is gone.
		// Flattened and filtered, NOT [DOM.navbar, DOM.heroChildren] — that
		// second entry is an HTMLCollection, and on any page without a
		// .hero_wrapper (i.e. anything but the home page — /services is the
		// first) it is the `?? []` fallback instead. GSAP flattens the outer
		// array one level, so an empty inner array left an undefined slot in
		// the target list and every tween built from it threw
		// "Cannot read properties of undefined (reading 'opacity')" — thrown
		// again on each frame from the timeline's own render, which meant the
		// preloader never reached its onComplete and never lifted: the page
		// sat under the loader forever.
		const introTargets = [DOM.navbar, ...DOM.heroChildren].filter(Boolean);

		gsap.set(introTargets, { autoAlpha: 0 });

		const progress = { value: 0 };

		gsap
			.timeline({
				defaults: { ease: "power4.inOut" },
				onComplete: () => {
					document.getElementById("scroll-lock")?.remove();
					if (isSmoother()) window.smoother.paused(false);
					ScrollTrigger.refresh();
					gsap.set(preloader, { display: "none" });
				},
			})
			.to(
				progress,
				{
					value: 100,
					duration: 1.5,
					onUpdate: () => {
						if (DOM.counter) {
							DOM.counter.textContent = String(Math.round(progress.value)).padStart(3, "0");
						}
					},
				},
				0,
			)
			.to([DOM.text, DOM.loader], { opacity: 1, duration: 1 }, 0)
			// pointerEvents: "none" alongside the opacity, not just opacity —
			// found while testing the menu2 panel: without it, this layer sat
			// invisible but still on top (z-index) of everything for the ~2.5s
			// between here and the timeline's own onComplete (which is what
			// finally sets display: none on the whole preloader), silently
			// swallowing any click made in that window anywhere on the page.
			.set(".preloader_bg_helper", { opacity: 0, pointerEvents: "none" }, ">")
			.to(DOM.loaderFill, { width: "100%", duration: 1.5 }, 0)
			.to(DOM.text, { autoAlpha: 0, duration: 0.5 })
			.to(
				DOM.loader,
				{
					autoAlpha: 0,
					width: "100vw",
					height: () => window.innerHeight,
					rotation: 0,
					duration: 1,
				},
				"<",
			)
			.to(
				DOM.bg,
				{
					width: "100vw",
					height: () => window.innerHeight,
					x: 0,
					y: 0,
					rotation: 0,
					clipPath:
						"polygon(0% 0%, 0% 100%, calc(0% - 0.001px) 100%, calc(0% - 0.001px) calc(0% - 0.001px), calc(100% + 0.001px) calc(0% - 0.001px), calc(100% + 0.001px) calc(100% + 0.001px), calc(0% - 0.001px) calc(100% + 0.001px), calc(0% - 0.001px) 100%, 100% 100%, 100% 0%)",
					duration: 1,
				},
				"<",
			)
			.to(introTargets, { autoAlpha: 1, duration: 1.5, stagger: 0.05 }, "-=0.4");
	});
}

function initPageshow(event) {
	if (event.persisted) {
		gsap.set(".u-preloader", { opacity: 0, display: "none" });
		if (window.smoother) window.smoother.paused(false);
	}
}

let preloaderStarted = false;
function startPreloader() {
	if (preloaderStarted) return;
	preloaderStarted = true;
	initPreloader();
}
if (document.readyState === "complete") startPreloader();
else window.addEventListener("load", startPreloader);
setTimeout(startPreloader, 2500);

window.addEventListener("pageshow", initPageshow);
