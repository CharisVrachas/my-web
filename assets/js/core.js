window.smoother = null;

window.smootherReady = new Promise((resolve) => {
	window._resolveSmootherReady = resolve;
});

if (history.scrollRestoration) {
	history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

function registerPlugins() {
	if (typeof gsap === "undefined") return;
	if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
	if (typeof ScrollSmoother !== "undefined") gsap.registerPlugin(ScrollSmoother);
	if (typeof MorphSVGPlugin !== "undefined") gsap.registerPlugin(MorphSVGPlugin);
	if (typeof SplitText !== "undefined") gsap.registerPlugin(SplitText);
	if (typeof ScrollToPlugin !== "undefined") gsap.registerPlugin(ScrollToPlugin);
}

function initSmoother() {
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
			const normalizeScrollConfig = {
				allowNestedScroll: true,
				type: "touch,pointer",
			};
			try {
				// normalizeScroll passed to ScrollSmoother itself, not a separate
				// ScrollTrigger.normalizeScroll() call — the two run as one
				// coordinated system this way (paused()/kill() disable and
				// re-enable the normalizer together; see ScrollSmoother.min.js).
				// A standalone call created a second, uncoordinated scroll
				// handler alongside the smoother's own, which is what was
				// shaking/juddering the page mid-scroll on touch devices.
				window.smoother = ScrollSmoother.create({
					smooth: 1.5,
					effects: true,
					normalizeScroll: isDesktop
						? { ...normalizeScrollConfig, ignore: "textarea, input, select" }
						: normalizeScrollConfig,
					onUpdate: () => {},
				});
				window.scrollNormalizer = window.smoother?.normalizer ?? null;
			} catch (e) {
				window.smoother = null;
				window.scrollNormalizer = null;
			}
			ScrollTrigger.config({
				ignoreMobileResize: true,
				limitCallbacks: true,
			});
			window._resolveSmootherReady(window.smoother);
		});
	});
}

function initGsapDefaults() {
	gsap.defaults({ ease: "none" });
	gsap.config({ force3D: true });
}
