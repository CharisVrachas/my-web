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
			window.scrollNormalizer = ScrollTrigger.normalizeScroll(
				isDesktop
					? { ...normalizeScrollConfig, ignore: "textarea, input, select" }
					: normalizeScrollConfig,
			);
			try {
				window.smoother = ScrollSmoother.create({
					smooth: 1.5,
					effects: true,
					onUpdate: () => {},
				});
			} catch (e) {
				window.smoother = null;
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
