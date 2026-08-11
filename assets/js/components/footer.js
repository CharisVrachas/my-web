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

	// footer.css's own min-height: calc(var(--vh) * 100) (≤991px) is what
	// this section relies on to fill the viewport with no dead gap above the
	// logo (see that rule's own comment) — but --vh itself (head.js) is
	// DELIBERATELY frozen against height-only resizes: on a phone, the
	// address bar showing/hiding fires a resize event with the same width
	// and a different height, and head.js's own guard skips recalculating
	// for exactly that case, on purpose — everywhere ELSE on this page that
	// reads --vh, a value that jumps every time the toolbar toggles mid-
	// scroll is the actual bug (visible content resizing under the user's
	// thumb), so freezing it there is correct.
	//
	// It is exactly the wrong choice for THIS min-height specifically,
	// because this is the one place on the page that measures its own
	// rendered size in JS (footer.offsetHeight, right below) and uses that
	// exact number as a pixel-for-pixel scroll-and-translate target. If the
	// CSS height it measures is stale, the translate distance is wrong by
	// however much the toolbar has since moved — under-translating and
	// cutting the top (the logo) off if the real viewport grew since
	// --vh was last set, which is exactly what scrolling to the bottom
	// naturally causes (the toolbar collapses out of the way on the way
	// down). A dedicated inline min-height, read fresh on every resize
	// with no width-match guard, keeps this one measurement honest without
	// touching --vh's own frozen behavior for every other section that
	// deliberately wants it that way. */
	const syncFooterMinHeight = () => {
		footerInner.style.minHeight = window.innerHeight + "px";
	};
	const syncPlaceholderHeight = () => {
		syncFooterMinHeight();
		placeholder.style.height = footer.offsetHeight + "px";
	};
	syncPlaceholderHeight();
	window.addEventListener("resize", () => {
		syncPlaceholderHeight();
		ScrollTrigger.refresh();
	});
	// The more precise, purpose-built version of the same signal — fires as
	// the toolbar itself animates in/out, not just once it settles, so the
	// placeholder/translate distance stays current a little sooner than
	// waiting on window's own resize alone. Feature-detected: unsupported
	// browsers just fall back to the window listener above, which still
	// covers this correctly on its own.
	window.visualViewport?.addEventListener("resize", () => {
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
