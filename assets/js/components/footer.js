// Ported from main.js's "07. scroll wrapper" block — specifically the
// "Footer Fixed Bottom Reveal Effect (Kanso style)" comment inside it, which
// is its own self-contained thing bolted onto the ScrollSmoother setup
// rather than a numbered section of its own. Split out here since
// core.js/app.js own ScrollSmoother's actual creation on this site (see
// initSmoother()) — this only adds the footer-specific reveal on top of it,
// once the smoother exists.
//
// The mechanism: .footer_placeholder is an empty, invisible element sized to
// exactly match .footer_fixed's real height, sitting at the very end of
// #smooth-content's in-flow content (after </main>). It contributes that
// much extra scroll distance to the page with nothing visibly happening —
// until its own top crosses the bottom of the viewport, which is when the
// scrollTrigger below starts scrubbing <main> upward by the footer's height.
// Since .footer_fixed sits BEHIND <main> the whole time (it's position:
// fixed, permanently at the bottom of the viewport, z-index below the
// navbar), pulling main away is what "reveals" it — nothing about the
// footer itself moves except its own scale, 0.95 → 1.
function initFooter() {
	const footer = document.querySelector(".footer_fixed");
	const placeholder = document.querySelector(".footer_placeholder");
	const main = document.querySelector("#smooth-content main");
	if (!footer || !placeholder || !main) return;

	const footerInner = footer.querySelector(".footer_area");

	const syncPlaceholderHeight = () => {
		placeholder.style.height = footer.offsetHeight + "px";
	};
	syncPlaceholderHeight();
	window.addEventListener("resize", () => {
		syncPlaceholderHeight();
		ScrollTrigger.refresh();
	});

	gsap.set(footerInner, { scale: 0.95 });

	gsap.timeline({
		scrollTrigger: {
			trigger: placeholder,
			start: "top bottom",
			end: "bottom bottom",
			scrub: 1,
			invalidateOnRefresh: true,
		},
	})
		.to(main, { y: () => -footer.offsetHeight, ease: "none" }, 0)
		.to(footerInner, { scale: 1, ease: "none" }, 0);

	const yearEl = document.querySelector("[data-footer-year]");
	if (yearEl) yearEl.textContent = new Date().getFullYear();

	initFooterClock();
}

// Live "day · time" in Chania specifically (Europe/Athens), not the
// visitor's own timezone — this replaces what used to be a static, never-
// confirmed "Mo – Sa / 9am – 5pm" business-hours placeholder. Intl's own
// timeZone option is what makes this Athens time regardless of where the
// page is actually being viewed from, with no manual UTC-offset math (and
// no DST bugs, which that math would have needed twice a year).
function initFooterClock() {
	const el = document.querySelector("[data-footer-time]");
	if (!el) return;

	const formatter = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Athens",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});

	function tick() {
		// en-GB's own output is "Mon, 14:32" — the comma read as a stray mark
		// next to the em dash the rest of this footer's labels use, so it's
		// swapped for one to match.
		el.textContent = formatter.format(new Date()).replace(",", " –");
	}

	tick();
	// Once a minute is as often as the displayed value can actually change —
	// anything more frequent would just be extra work for the same text.
	setInterval(tick, 60000);
}
