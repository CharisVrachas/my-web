// The "process card" stacking deck on /about — ported from Orisa's shared
// initScroll() (main.js block 51, ".scroll-section card stacking"), the same
// mechanic already used for WhyUs (initWhyUsStack, whyus.js) and the /services
// offer deck (initServicesPage, services-page.js).
//
// Each card's title and paragraphs reveal character by character before the
// next card arrives — the one card reveal every deck on the site shares
// (splitCardText / parkCardText / addCardReveal and CARD_REVEAL's READ/TRANS
// pacing, all in reveal.js), so it's identical to WhyUs, /services and /faq.
function initAboutStory() {
	const section = document.querySelector("[data-as-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-as-deck]");
	const cards = deck ? deck.querySelectorAll("[data-as-card]") : [];
	if (!cards.length) return;

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const { READ, TRANS } = CARD_REVEAL;
	const totalUnits = cards.length * READ + Math.max(0, cards.length - 1) * TRANS;

	// Split once, up front — not inside the matchMedia callback, which re-runs
	// on every breakpoint crossing and would split already-split text.
	const cardChars = Array.from(cards).map(splitCardText);

	const mm = gsap.matchMedia();

	// Below 992px the cards sit in normal flow (about-page.css) and each one
	// reveals against its own scroll position (addInFlowCardReveal) — the same
	// character reveal, the same way /faq does it on phones. A pinned card has
	// one screen of height, and the About copy (card 1 especially, and more so
	// in Greek) needs several on a phone: pinned, most of it was clipped.
	mm.add(
		{
			desktop: "(min-width: 992px)",
			mobile: "(max-width: 991px)",
		},
		(context) => {
			const { desktop } = context.conditions;

			cardChars.forEach((chars) => parkCardText(chars, reduced));

			if (!desktop) {
				cards.forEach((card, index) => addInFlowCardReveal(card, cardChars[index], reduced));
				return () => {
					cardChars.forEach((chars) => chars.length && gsap.set(chars, { clearProps: "opacity,x" }));
				};
			}

			cards.forEach((card, index) => {
				gsap.set(card, { zIndex: index });
				// 101%, not 100 — at exactly 100 sub-pixel rounding left a sliver of
				// the incoming card (and its photo) visible along the bottom before
				// it was meant to arrive. Same fix as the /services deck.
				if (index !== 0) gsap.set(card, { yPercent: 101 });
			});

			const timeline = gsap.timeline({
				scrollTrigger: {
					// Pin the DECK, not the section — .as_story_head above it (eyebrow,
					// heading, statement) has to stay in normal scrolling flow, or it
					// eats into the height every card has for its own content.
					trigger: deck,
					pin: deck,
					start: "top top",
					end: () => `+=${totalUnits * 50}%`,
					scrub: 1,
					invalidateOnRefresh: true,
				},
				defaults: { ease: "none" },
			});

			cards.forEach((card, index) => {
				addCardReveal(timeline, cardChars[index], reduced);

				const next = cards[index + 1];
				// The last card is never scaled — nothing arrives after it to cover
				// the result.
				if (!next) return;

				// Scale the INNER content, not the card itself — the card carries the
				// opaque background that has to keep covering the full box while it's
				// the top card.
				timeline.to(card.querySelector(".as_card_inner"), { scale: 0.9, duration: TRANS });
				timeline.to(next, { yPercent: 0, duration: TRANS }, "<");
			});

			return () => {
				gsap.set(cards, { clearProps: "transform,zIndex" });
				cardChars.forEach((chars) => chars.length && gsap.set(chars, { clearProps: "opacity,x" }));
			};
		},
	);
}
