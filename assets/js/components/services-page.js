// The "Things we offer" stacking deck on /services — ported from Orisa's
// shared initScroll() (main.js block 51, ".scroll-section card stacking"),
// which its home-2/sec-4 section drives this deck with.
//
// The mechanic, verbatim from there: pin, and for each card in turn tween
// that card down to scale 0.9 while the NEXT one comes up from yPercent 100
// at the same moment. The card underneath is never hidden — it is only
// scaled — which is why every card has to be fully opaque (see the note on
// .sv_offer_card in services-page.css; whyus.css has the same one, from the
// same bug).
//
// Each card's title, paragraphs and bullets reveal character by character
// before the next card arrives — the one card reveal every deck on the site
// shares (splitCardText / parkCardText / addCardReveal and CARD_REVEAL's
// READ/TRANS pacing, all in reveal.js), so it's identical here, on WhyUs, on
// /about and on /faq.
//
// This is deliberately its own function rather than a call into
// initWhyUsStack(): that one also owns the WhyUs side-nav, and this deck has
// no nav to sync.
function initServicesPage() {
	const section = document.querySelector("[data-sv-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-sv-deck]");
	const cards = deck ? deck.querySelectorAll("[data-sv-card]") : [];
	if (!cards.length) return;

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const { READ, TRANS } = CARD_REVEAL;
	const totalUnits = cards.length * READ + Math.max(0, cards.length - 1) * TRANS;

	// The per-letter hover stretch Orisa puts on each card title
	// (`text-scale-anim`, home-2/sec-4.html) — run BEFORE the text is split for
	// the reveal, so splitCardText() reuses these letter spans on the title
	// instead of splitting it a second time.
	if (typeof initTextScaleAnim === "function") initTextScaleAnim(section);

	// Split once, up front — not inside the matchMedia callback, which re-runs
	// on every breakpoint crossing and would split already-split text.
	const cardChars = Array.from(cards).map(splitCardText);

	// matchMedia (not a bare innerWidth check) so the pin is built and torn
	// down properly when the viewport crosses the boundary, including the
	// ScrollTrigger it creates. The deck runs at every width.
	const mm = gsap.matchMedia();
	// The deck's pin, kept for scrollToCard() below — rebuilt (so reassigned)
	// whenever the viewport crosses between the two matchMedia branches.
	let deckTrigger = null;

	mm.add(
		{
			desktop: "(min-width: 992px)",
			mobile: "(max-width: 991px)",
		},
		(context) => {
			const { desktop } = context.conditions;

			cards.forEach((card, index) => {
				// z-index by index so the card arriving is always painted over the
				// one it is covering, whatever their DOM order.
				gsap.set(card, { zIndex: index });
				// 101, not 100: at exactly 100 sub-pixel rounding between the card's
				// height and the pinned deck's left a 2-3px sliver of the next card
				// (and its photo) showing along the bottom.
				if (index !== 0) gsap.set(card, { yPercent: 101 });
			});

			cardChars.forEach((chars) => parkCardText(chars, reduced));

			const timeline = gsap.timeline({
				scrollTrigger: {
					// The DECK is pinned, not the whole section — pinning the section
					// froze the "Things we offer" header inside the pinned viewport
					// too and cut every card's own content off the bottom.
					trigger: deck,
					pin: deck,
					// Mobile clears the fixed navbar's MENU pill, like WhyUs's and
					// /about's own mobile pins.
					start: desktop ? "top top" : "top top+=72",
					end: () => `+=${totalUnits * 50}%`,
					scrub: 1,
					invalidateOnRefresh: true,
				},
				defaults: { ease: "none" },
			});

			cards.forEach((card, index) => {
				addCardReveal(timeline, cardChars[index], reduced);

				const next = cards[index + 1];
				// The last card is never scaled down: with nothing arriving to cover
				// it, it would just shrink on screen with the panel showing around it.
				if (!next) return;

				// Scale the INNER box, not the whole card. The card carries the opaque
				// background and must keep covering the full box while it's on top.
				timeline.to(card.querySelector(".sv_offer_card_inner"), { scale: 0.9, duration: TRANS });
				timeline.to(next, { yPercent: 0, duration: TRANS }, "<");
			});

			deckTrigger = timeline.scrollTrigger;

			return () => {
				deckTrigger = null;
				gsap.set(cards, { clearProps: "transform,zIndex" });
				cardChars.forEach((chars) => chars.length && gsap.set(chars, { clearProps: "opacity,x" }));
			};
		},
	);

	// /services#<slug> — the navbar's Services dropdown (Navbar.astro, slugs from
	// src/data/services.ts). The slug is deliberately not an element id: every
	// card sits stacked at the same spot inside the pinned deck, so the only
	// meaningful "position" a card has is how far into the deck's own timeline
	// it is. Card i is fully on top at i × (READ + TRANS); landing at the end of
	// its READ stretch means its text has finished revealing on arrival.
	const trimSlash = (path) => path.replace(/\/+$/, "");
	const slugFromHash = (hash) => decodeURIComponent((hash || "").replace(/^#/, ""));

	function scrollToCard(slug) {
		if (!slug || !deckTrigger) return false;
		const index = Array.from(cards).findIndex((card) => card.dataset.svSlug === slug);
		if (index === -1) return false;
		const time = Math.min(index * (READ + TRANS) + READ, totalUnits);
		const target = deckTrigger.start + (deckTrigger.end - deckTrigger.start) * (time / totalUnits);
		if (window.smoother) {
			gsap.to(window.smoother, { scrollTop: target, duration: 2, ease: "expo.inOut", overwrite: true });
		} else {
			window.scrollTo({ top: target, behavior: "smooth" });
		}
		return true;
	}

	// Arriving from another page: wait for the preloader to finish
	// (preloader.js) — until then the page is scroll-locked, the smoother is
	// paused, and its closing ScrollTrigger.refresh() is what settles the deck's
	// own start/end.
	const initialSlug = slugFromHash(location.hash);
	if (initialSlug) {
		const goToInitial = () => scrollToCard(initialSlug);
		if (window.preloaderDone) goToInitial();
		else window.addEventListener("minos:preloader-done", goToInitial, { once: true });
	}

	// Already on /services: the dropdown points at this same page, so its clicks
	// are handled here instead of by the browser — preventDefault stops a native
	// hash jump, and this still works on a repeat click of the same service,
	// which a hashchange listener would miss.
	document.addEventListener("click", (e) => {
		const link = e.target.closest?.("a[href*='#']");
		if (!link || trimSlash(link.pathname) !== trimSlash(location.pathname)) return;
		const slug = slugFromHash(link.hash);
		if (!scrollToCard(slug)) return;
		e.preventDefault();
		history.replaceState(null, "", `#${slug}`);
	});
}
