// The "process card" stacking deck on /about — ported from Orisa's shared
// initScroll() (main.js block 51, ".scroll-section card stacking"), the same
// mechanic already used for WhyUs (initWhyUsStack, whyus.js) and the
// /services offer deck (initServicesPage, services-page.js).
//
// This is the simplest of the three: Orisa's about-3/sec-2.html gives none of
// its .process-card titles/descriptions a reveal-text or text-scale-anim
// class (unlike home-2/sec-4, the source of the /services deck, which gives
// its own heading and paragraph both effects) — so unlike services-page.js,
// there is no per-card reveal to key off each card's arrival here. The cards
// just slide into place; nothing inside them animates on its own.
function initAboutStory() {
	const section = document.querySelector("[data-as-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-as-deck]");
	const cards = deck ? deck.querySelectorAll("[data-as-card]") : [];
	if (!cards.length) return;

	const mm = gsap.matchMedia();

	// Same 992px cutover as the /services deck for the DESKTOP tween below —
	// but this deck now runs at every width (see the mobile branch further
	// down), the same fix WhyUs's own stacking deck already went through:
	// leaving mobile with a plain list read as "no effect at all", when the
	// actual desktop effect is what was being asked for everywhere.
	mm.add(
		{
			desktop: "(min-width: 992px)",
			mobile: "(max-width: 991px)",
		},
		(context) => {
			const { desktop } = context.conditions;

			cards.forEach((card, index) => {
				gsap.set(card, { zIndex: index });
				// 101%, not 100 — at exactly 100 the incoming card's own top edge
				// lands flush with the viewport's bottom edge, and sub-pixel
				// rounding between its height and the pinned deck's left a sliver of
				// it (and its photo) visible along the bottom before it was meant to
				// arrive. Found and fixed once already on the /services deck; same
				// fix here since this is the same mechanic.
				if (index !== 0) gsap.set(card, { yPercent: 101 });
			});

			const timeline = gsap.timeline({
				scrollTrigger: {
					// Pin the DECK, not the section — .as_story_head above it (the
					// eyebrow/heading/statement) has to stay in normal scrolling flow.
					// Pinning the whole section once froze that header inside the
					// pinned viewport too, eating into the height every card had to
					// fit its own content in. Found and fixed on the /services deck
					// first; same fix, same reason, here.
					trigger: deck,
					pin: deck,
					// Mobile clears the fixed navbar's own MENU button the same way
					// WhyUs's mobile pin does (whyus.js) — desktop's header sits
					// above the deck in normal flow already, so it needs no offset.
					start: desktop ? "top top" : "top top+=72",
					end: () => `+=${cards.length * 50}%`,
					scrub: 1,
					invalidateOnRefresh: true,
				},
				defaults: { ease: "none" },
			});

			cards.forEach((card, index) => {
				const next = cards[index + 1];
				// The last card is never scaled — nothing arrives after it to cover
				// the result, so scaling it down would just shrink it in place with
				// the deck's own background showing around it.
				if (!next) return;

				// Scale the INNER content, not the card itself — the card carries
				// the opaque background that has to keep covering the full viewport
				// for as long as it's the top card. Scaling the card's own box
				// shrank that background too and opened a band top and bottom where
				// the next card (already sliding up underneath) showed through.
				timeline.to(card.querySelector(".as_card_inner"), { scale: 0.9 });
				timeline.to(next, { yPercent: 0 }, "<");
			});

			return () => {
				gsap.set(cards, { clearProps: "transform,zIndex" });
			};
		},
	);
}
