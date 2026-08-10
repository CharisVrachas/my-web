!(function (o, c) {
	var n = c.documentElement,
		t = " is-";
	((n.className += t + "js"),
		("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
			(n.className += t + "touch"));
})(window, document);

// Failsafe: assets/css/scroll-lock.css freezes the page until the preloader
// finishes. If GSAP fails to load, or the preloader throws, nothing would ever
// remove it and the page would be permanently unscrollable. Release it after a
// hard deadline no matter what — the preloader normally removes it far sooner.
(function () {
	const RELEASE_AFTER_MS = 8000;
	setTimeout(() => {
		document.getElementById("scroll-lock")?.remove();
	}, RELEASE_AFTER_MS);
	window.addEventListener("error", () => {
		document.getElementById("scroll-lock")?.remove();
	});
})();

(function () {
	const root = document.documentElement;
	let lastWidth = window.innerWidth;
	function setVh() {
		root.style.setProperty("--vh", window.innerHeight * 0.01 + "px");
	}
	setVh();
	window.addEventListener("resize", () => {
		if (window.innerWidth === lastWidth) return;
		lastWidth = window.innerWidth;
		setVh();
	});
	window.addEventListener("orientationchange", () => {
		lastWidth = window.innerWidth;
		setVh();
	});
})();
