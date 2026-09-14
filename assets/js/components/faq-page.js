// /faq — two independent pieces: the accordion interaction, and the
// four-topic stacking deck it sits inside (the same .scroll-section
// mechanic as WhyUs/services-page.js/about-page.js).

// Reimplements Orisa's Bootstrap accordion (data-bs-toggle="collapse",
// data-bs-parent) in plain JS — no Bootstrap JS is loaded on this site.
// Same behaviour: one open question per topic group at a time; opening one
// closes whichever other one in that same group was open.
function initFaqAccordion() {
	const groups = document.querySelectorAll("[data-fq-accordion]");
	if (!groups.length) return;

	groups.forEach((group) => {
		const items = group.querySelectorAll("[data-fq-item]");

		items.forEach((item) => {
			const header = item.querySelector(".fq_item_header");
			const panel = item.querySelector(".fq_item_panel");
			if (!header || !panel) return;

			header.addEventListener("click", () => {
				const isOpen = header.getAttribute("aria-expanded") === "true";

				// Close every item in this group first — including this one, if
				// it was already open, so clicking an open question closes it
				// rather than being a no-op.
				items.forEach((other) => {
					const otherHeader = other.querySelector(".fq_item_header");
					const otherPanel = other.querySelector(".fq_item_panel");
					otherHeader.setAttribute("aria-expanded", "false");
					otherPanel.classList.remove("is-open");
				});

				if (!isOpen) {
					header.setAttribute("aria-expanded", "true");
					panel.classList.add("is-open");
				}
			});
		});
	});
}

// The stacking deck — pin/scale/yPercent, identical to initServicesPage()/
// initAboutStory(): pin the DECK not the section, background on the full
// 100vh card not the inner box, yPercent 101 not 100.
//
// Each topic's title and subtitle reveal character by character — the one
// card reveal every deck on the site shares (reveal.js's splitCardText /
// parkCardText / addCardReveal and CARD_REVEAL's READ/TRANS pacing), so it's
// identical to WhyUs, /services and /about. Below 992px this deck isn't
// pinned (faq-page.css keeps the cards in normal flow), so there each card
// reveals against its own scroll position instead (addInFlowCardReveal) —
// the same effect, just driven by the card scrolling past rather than by a
// pinned timeline.
function initFaqStack() {
	const section = document.querySelector("[data-fq-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-fq-deck]");
	const cards = deck ? deck.querySelectorAll("[data-fq-card]") : [];
	if (!cards.length) return;

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const { READ, TRANS } = CARD_REVEAL;
	const totalUnits = cards.length * READ + Math.max(0, cards.length - 1) * TRANS;

	// Split once, up front — not inside the matchMedia callback, which re-runs
	// on every breakpoint crossing and would split already-split text.
	const cardChars = Array.from(cards).map(splitCardText);

	const mm = gsap.matchMedia();

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
				if (index !== 0) gsap.set(card, { yPercent: 101 });
			});

			const timeline = gsap.timeline({
				scrollTrigger: {
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
				if (!next) return;
				// 0.9 like every other deck (was 0.92 here).
				timeline.to(card.querySelector(".fq_card_inner"), { scale: 0.9, duration: TRANS });
				timeline.to(next, { yPercent: 0, duration: TRANS }, "<");
			});

			return () => {
				gsap.set(cards, { clearProps: "transform,zIndex" });
				cardChars.forEach((chars) => chars.length && gsap.set(chars, { clearProps: "opacity,x" }));
			};
		},
	);
}
