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
// initAboutStory(). See either for the fuller reasoning behind each fix;
// summarised here since this is the fourth time the same three apply:
//   1. pin the DECK, not the section — a header above the deck would
//      otherwise get pinned along with it and eat into every card's height.
//   2. background lives on the full 100vh card, not the card's inner content
//      box — otherwise a scaled-down outgoing card leaves a band of the
//      incoming one showing through at its top/bottom edges.
//   3. yPercent 101, not 100 — at exactly 100 sub-pixel rounding leaves a
//      sliver of the incoming card visible before its cue.
//
// Title reveal, take four — three GSAP/SplitText-based attempts (a .call()
// inside the scrubbed timeline; a per-frame progress check; firing all four
// off the pin's own onEnter) all still left only card 1's title ever
// actually turning visible, for a reason none of them surfaced: the
// SplitText loop that was supposed to populate a per-card Map of
// [data-fq-reveal] characters wasn't reliably doing so for cards 2–4, so
// revealCard() had nothing to animate for them no matter when it was
// called. Rather than a fourth guess at GSAP/SplitText internals, this
// drops both entirely for this effect: a plain CSS transition
// (faq-page.css, .fq_title) driven by ONE class on the deck, toggled by a
// plain ScrollTrigger with no pin, no scrub, no SplitText, and no per-card
// bookkeeping to go wrong. All four titles carry the identical rule, so
// they're guaranteed to look the same — which was the actual ask.
function initFaqStack() {
	const section = document.querySelector("[data-fq-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-fq-deck]");
	const cards = deck ? deck.querySelectorAll("[data-fq-card]") : [];
	if (!cards.length) return;

	ScrollTrigger.create({
		trigger: deck,
		start: "top 80%",
		onEnter: () => deck.classList.add("is-revealed"),
		once: true,
	});

	const mm = gsap.matchMedia();

	mm.add("(min-width: 992px)", () => {
		cards.forEach((card, index) => {
			gsap.set(card, { zIndex: index });
			if (index !== 0) gsap.set(card, { yPercent: 101 });
		});

		const timeline = gsap.timeline({
			scrollTrigger: {
				trigger: deck,
				pin: deck,
				start: "top top",
				end: () => `+=${cards.length * 50}%`,
				scrub: 1,
				invalidateOnRefresh: true,
			},
			defaults: { ease: "none" },
		});

		cards.forEach((card, index) => {
			const next = cards[index + 1];
			if (!next) return;
			timeline.to(card.querySelector(".fq_card_inner"), { scale: 0.92, duration: 1 });
			timeline.to(next, { yPercent: 0, duration: 1 }, "<");
		});

		return () => {
			gsap.set(cards, { clearProps: "transform,zIndex" });
		};
	});
}
