// The "Things we offer" stacking deck on /services — ported from Orisa's
// shared initScroll() (main.js block 51, ".scroll-section card stacking"),
// which its home-2/sec-4 section drives this deck with.
//
// The mechanic, verbatim from there: pin the section, give it
// `items.length * 50%` of scroll to play out, and for each card in turn tween
// that card down to scale 0.9 while the NEXT one comes up from yPercent 100
// at the same moment ('<'). The card underneath is never hidden — it is only
// scaled — which is why every card has to be fully opaque (see the note on
// .sv_offer_card_inner in services-page.css; whyus.css has the same one, from
// the same bug).
//
// This is deliberately its own function rather than a call into
// initWhyUsStack(): that one also owns the WhyUs side-nav, syncing an active
// index on every update, and this deck has no nav to sync. Sharing it would
// mean guarding half of it. The animation itself is identical.
function initServicesPage() {
	const section = document.querySelector("[data-sv-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-sv-deck]");
	const cards = deck ? deck.querySelectorAll("[data-sv-card]") : [];
	if (!cards.length) return;

	// Split each card's copy into characters up front, and park them at the
	// same "not yet revealed" state reveal.js uses (opacity 0.3, nudged 7px
	// left). The tween back out of it is added to the stack timeline below, at
	// the moment that card arrives.
	//
	// The markup carries data-sv-reveal, NOT data-reveal-text, precisely so
	// reveal.js does not claim these — see the longer note further down for
	// why its document-position-based triggers cannot work inside a pinned
	// deck of stacked cards.
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const revealChars = new Map();

	// One card's worth of timeline. Every tween below states it explicitly so
	// the card transition is measured against a consistent unit — with a
	// scrubbed timeline, "duration" is really "share of the scroll", so a
	// tween that runs long simply spills into the next card's stretch of
	// scrolling.
	const SEGMENT = 1;

	if (!reduced) {
		cards.forEach((card) => {
			const target = card.querySelector("[data-sv-reveal]");
			if (!target) return;
			const split = new SplitText(target, { type: "lines,words,chars", linesClass: "split-line" });
			if (!split.chars || !split.chars.length) return;
			gsap.set(split.chars, { opacity: 0.3, x: -7 });
			revealChars.set(card, split.chars);
		});
	}

	// Fires a card's own copy reveal as a standalone, fixed-DURATION tween
	// (0.7 real seconds) instead of one scrubbed together with the card's
	// slide-in. Both used to ride the SAME ~450px of scroll (one SEGMENT of
	// nine); that covers in well under a second on an ordinary trackpad
	// flick, faster than the 1-second scrub smoothing can even catch up —
	// so cards reached after the viewer had already built up scrolling
	// momentum could finish revealing before a frame ever rendered mid-
	// transition. Card 1 didn't show the problem only because it plays the
	// moment the section is scrolled into, while a viewer is still moving
	// slowly getting their bearings. Firing a fixed-duration tween once per
	// arrival — rather than scrubbing it to scroll position — makes every
	// card's reveal take the same real 0.7s once triggered, regardless of
	// how fast the scroll that triggered it was.
	function revealCard(card) {
		const chars = revealChars.get(card);
		if (!chars) return;
		gsap.to(chars, { opacity: 1, x: 0, duration: 0.7, stagger: { amount: 0.35 }, ease: "power1.out", overwrite: true });
	}

	// matchMedia (not a bare innerWidth check) so the pin is built and torn
	// down properly when the viewport crosses the boundary, including the
	// ScrollTrigger it creates. The deck now runs at every width — it used
	// to be desktop-only, on the theory that a phone has no room for a
	// pinned deck this tall, but leaving mobile with a plain unstacked list
	// is what actually reads as "the desktop effect is missing here".
	const mm = gsap.matchMedia();

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
				// 101, not 100: at exactly 100 the card's top edge lands on the
				// viewport's bottom edge, and sub-pixel rounding between the card's
				// own height and the pinned deck's left a 2-3px sliver of the card
				// showing along the bottom — enough to catch the top edge of its
				// photo and read as a thin broken strip under the current card. The
				// extra 1% is ~8px of clearance; it tweens to 0 either way, so
				// nothing about the arrival looks different.
				if (index !== 0) gsap.set(card, { yPercent: 101 });
			});

			const timeline = gsap.timeline({
				scrollTrigger: {
					// The DECK is pinned, not the whole section — Orisa pins its
					// .scroll-section element, which holds only the cards; the
					// "Things we offer" header above it is a sibling that scrolls
					// away normally. Pinning the section instead (what this did at
					// first) froze the header inside the pinned viewport too, so it
					// took ~300px off the top and every card's own content ran off
					// the bottom of the screen and got cut mid-list.
					trigger: deck,
					pin: deck,
					// Mobile clears the fixed navbar's own MENU button the same way
					// WhyUs's and /about's own mobile pins do — desktop's header
					// sits above the deck in normal flow already and needs no offset.
					start: desktop ? "top top" : "top top+=72",
					end: () => `+=${cards.length * 50}%`,
					scrub: 1,
					invalidateOnRefresh: true,
					// Card 1's own reveal: fires the first time the deck scrolls into
					// its pinned range, not immediately at setup — which would let it
					// finish before the section was ever actually on screen.
					onEnter: () => revealCard(cards[0]),
				},
				// Orisa sets this explicitly, and it matters: core.js already sets
				// gsap.defaults({ ease: "none" }) globally, but stating it here keeps
				// the deck linear even if that global default is ever changed.
				defaults: { ease: "none" },
			});

			cards.forEach((card, index) => {
				const next = cards[index + 1];

				// The last card is never scaled down. Orisa scales every item,
				// including its last, but there it does not matter: nothing follows,
				// so nobody sees the result. Here it did — with nothing arriving to
				// cover it, the final card just shrank on screen and left the deck's
				// own background showing in a band around it.
				if (!next) return;

				// Scale the INNER box, not the whole card. The card carries the
				// opaque background (services-page.css) and must keep covering the
				// full viewport for as long as it is the top card; scaling the card
				// itself shrank that background too, opening a ~40px band along the
				// top and bottom edges. The next card is mid-slide through exactly
				// that band, so a strip of its photo showed through underneath the
				// current card — the "broken image" along the bottom edge. Scaling
				// only the content keeps the visual (the card receding) with the
				// cover intact.
				timeline.to(card.querySelector(".sv_offer_card_inner"), { scale: 0.9, duration: SEGMENT });
				timeline.to(next, { yPercent: 0, duration: SEGMENT }, "<");

				// Each card's own copy reveals as that card arrives. reveal.js's
				// generic [data-reveal-text] handling cannot work in here at all —
				// it positions each element's trigger from where the element sits
				// in the document, and every card in this deck is stacked at the
				// same absolute position inside a pinned container. All nine
				// resolved to nearly the same start (~1700) and end (~2200) inside
				// a pin that spans 1232-4517, so every card from the fourth on had
				// already finished revealing, at full opacity, long before it was
				// scrolled into view. .call(), not .to() — this needs to be a
				// discrete trigger the scrubbed playhead fires in passing, not a
				// tween the scrub itself drives; see revealCard()'s own comment.
				timeline.call(() => revealCard(next), [], "<");
			});

			// Cleanup for the matchMedia teardown — clears the inline transforms
			// the tweens left behind, and resets the reveal chars, so crossing
			// back over the breakpoint starts clean rather than carrying over
			// whatever state the other branch left mid-transition.
			return () => {
				gsap.set(cards, { clearProps: "transform,zIndex" });
				revealChars.forEach((chars) => gsap.set(chars, { clearProps: "opacity,x" }));
			};
		},
	);

	// The per-letter hover effect Orisa puts on each card's own title
	// (`text-scale-anim` on the <h1> in home-2/sec-4.html): hovering a letter
	// stretches it vertically and lifts its two neighbours by half as much.
	// Already implemented for the home page's WhyUs headings — reused here
	// rather than copied, since it takes the root to search as an argument and
	// carries no WhyUs-specific state. Outside the matchMedia block on purpose:
	// this is a hover effect, not a scroll one, and it should work at every
	// width, including the sizes where the deck is a plain list.
	if (typeof initTextScaleAnim === "function") initTextScaleAnim(section);
}
