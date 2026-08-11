// The "process card" stacking deck on /about — ported from Orisa's shared
// initScroll() (main.js block 51, ".scroll-section card stacking"), the same
// mechanic already used for WhyUs (initWhyUsStack, whyus.js) and the
// /services offer deck (initServicesPage, services-page.js).
//
// Orisa's about-3/sec-2.html gives none of its .process-card titles/
// descriptions a reveal-text or text-scale-anim class (unlike home-2/sec-4,
// the source of the /services deck, which gives its own heading and
// paragraph both effects) — so this had no per-card reveal to key off each
// card's arrival, unlike services-page.js's own char-by-char one. Added
// below: each card's own description now reveals character by character,
// SCRUBBED directly to scroll position (not services-page.js's fixed 0.7s
// real-time reveal) — first character first, and the reveal itself is what
// the reader scrolls THROUGH before the deck moves on to the next card, so
// scrolling slowly to actually read it plays the reveal at exactly that
// pace instead of racing ahead of it. See the READ/TRANS split below for how
// that reading room is built into the timeline.
function initAboutStory() {
	const section = document.querySelector("[data-as-stack]");
	if (!section) return;

	const deck = section.querySelector("[data-as-deck]");
	const cards = deck ? deck.querySelectorAll("[data-as-card]") : [];
	if (!cards.length) return;

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

			// One SplitText call per card, kept even if reduced-motion skips the
			// tween below — the DOM still needs the char spans for the plain
			// solid-opacity fallback (gsap.set right after) to target.
			const cardChars = Array.from(cards).map((card) => {
				const descs = card.querySelectorAll(".as_card_desc");
				if (!descs.length) return null;
				// "words,chars", not just "chars" — chars alone gives every
				// letter its own independent inline-block div with nothing
				// grouping the ones that make up one word, so the browser's own
				// line-breaking treated each CHARACTER as a wrap point instead
				// of each word — confirmed visually ("more" breaking as "mor" /
				// "e" across a line end). reveal.js's own initRevealText splits
				// "lines,words,chars" for the same reason; this needs the
				// words level too, just not the lines one (nothing here reveals
				// per line).
				const split = new SplitText(descs, { type: "words,chars" });
				return split.chars && split.chars.length ? split.chars : null;
			});

			if (reduced) {
				cardChars.forEach((chars) => chars && gsap.set(chars, { opacity: 1 }));
			} else {
				cardChars.forEach((chars) => chars && gsap.set(chars, { opacity: 0.25 }));
			}

			// READ is what actually answers "θέλω... να προλαβαίνει να διαβάζει
			// ολόκληρο το κείμενο ο αναγνώστης" (I want the reader to have time
			// to read the whole text) — a dedicated span of the scrubbed timeline
			// per card, spent solely on revealing ITS OWN text character by
			// character, before TRANS (the existing scale-down/rise-up tween)
			// ever starts. Without it, a card's reveal and the transition INTO
			// the next one were the same instant of scroll — scrolling at any
			// normal pace could carry the reader past a card before its own text
			// had even finished fading in. 1.4:1 against TRANS's own implicit
			// duration of 1 is roughly how much longer "read a few sentences"
			// takes versus "watch a card slide" at this deck's established
			// pace (the original cards.length*50% end distance, i.e. 50% of a
			// viewport's height of scroll per TRANS-sized unit) — end is scaled
			// by the same ratio below so that per-unit pace doesn't change,
			// only the total scroll distance the extra READ units add. */
			const READ = 1.4;
			const TRANS = 1;
			const totalUnits = cards.length * READ + Math.max(0, cards.length - 1) * TRANS;

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
					// 50% per unit — the ORIGINAL pacing (cards.length*50% against a
					// cards.length-1-unit timeline of TRANS-only tweens), carried
					// over unchanged now that READ units are part of the total too,
					// so the scroll distance a TRANS transition takes still feels
					// the same as it always did; the READ units are what make the
					// timeline — and the scroll distance — longer overall.
					end: () => `+=${totalUnits * 50}%`,
					scrub: 1,
					invalidateOnRefresh: true,
				},
				defaults: { ease: "none" },
			});

			cards.forEach((card, index) => {
				const chars = cardChars[index];
				if (chars && !reduced) {
					// from: "start" — the char array is already in reading order
					// (SplitText walks the DOM front to back), so staggering from
					// its own start is what makes the FIRST character the first
					// one to reveal, not the last: "πάντα αυτό το εφέ να ξεκινάει
					// από την πρώτη λέξη και όχι από το τέλος σχεδόν" was this,
					// stated as a constraint rather than a bug — easy to get
					// backwards with a stagger, so it's spelled out explicitly.
					timeline.to(chars, {
						opacity: 1,
						duration: 0.3,
						stagger: { each: Math.max(0.002, (READ - 0.3) / chars.length), from: "start" },
					});
				} else {
					// Reduced motion (or no description found): still spends the
					// card's own READ share of the timeline, just with nothing
					// animating during it — otherwise this card's whole reading
					// window would collapse to zero and the deck would jump
					// straight from the previous card's transition into this
					// card's own, with no pause between them.
					timeline.to({}, { duration: READ });
				}

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
				timeline.to(card.querySelector(".as_card_inner"), { scale: 0.9, duration: TRANS });
				timeline.to(next, { yPercent: 0, duration: TRANS }, "<");
			});

			return () => {
				gsap.set(cards, { clearProps: "transform,zIndex" });
				cardChars.forEach((chars) => chars && gsap.set(chars, { clearProps: "opacity" }));
			};
		},
	);
}
