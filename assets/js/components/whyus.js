// Ported from two blocks of Orisa's main.js:
//   32. section-fix (pin section-title + stacking cards)
//   21. text-scale-anim
//
// The stacking is Orisa's: every card after the first starts at yPercent
// 100, and each step scales the outgoing card to 0.9 while bringing the next
// one up to yPercent 0 at the same position ("<"). The nav's active row is
// set from the timeline's own progress in onUpdate, which is why it can never
// drift out of sync with the card on top.
//
// Each card's title and bullets reveal character by character before the
// next card arrives — the one card reveal every deck on the site shares
// (splitCardText / parkCardText / addCardReveal and CARD_REVEAL's READ/TRANS
// pacing, in reveal.js), so it's identical to /services, /about and /faq.
//
// Two things changed on the way in from Orisa, neither of them behavioural:
//   - Orisa re-runs its active-row update on every ScrollTrigger 'scroll'
//     event as well as in onUpdate. With ScrollSmoother driving scroll here,
//     onUpdate already fires on every frame the pin is active, so the extra
//     global listener was redundant — and a leak, since nothing removed it.
//   - text-scale-anim bound its per-letter hover with jQuery. Same two
//     events, addEventListener instead.
function initWhyUs() {
	const section = document.querySelector(".section_whyus");
	if (!section) return;

	// Letter spans first: the deck's character reveal reuses the
	// .at-letter-span letters this creates on each card title rather than
	// splitting the title a second time.
	initTextScaleAnim(section);
	initWhyUsStack(section);
}

function initWhyUsStack(section) {
	const pin = section.querySelector(".whyus_pin");
	const list = section.querySelector("[data-whyus-list]");
	const nav = section.querySelector("[data-whyus-nav]");
	if (!pin || !list || !nav) return;

	const cards = list.querySelectorAll(".whyus_card");
	const navItems = nav.querySelectorAll(".whyus_nav_item");
	if (!cards.length) return;

	const stack = section.querySelector(".whyus_stack");
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const { READ, TRANS } = CARD_REVEAL;
	const totalUnits = cards.length * READ + Math.max(0, cards.length - 1) * TRANS;

	// Split once, up front — not inside the matchMedia callback, which re-runs
	// on every breakpoint crossing and would split already-split text.
	const cardChars = Array.from(cards).map(splitCardText);

	// The deck runs at EVERY width. Desktop pins .whyus_pin (the numbered nav,
	// the three-piece mark and the cards together); on a phone .whyus_body is a
	// single column, so .whyus_stack alone pins instead — the mark scrolls in
	// and breaks apart on its way past, then the card column deals the five
	// cards exactly as on desktop. Only the pinned element differs per width.
	const mm = gsap.matchMedia();
	mm.add(
		{
			desktop: "(min-width: 992px)",
			mobile: "(max-width: 991px)",
		},
		(context) => {
			const { desktop } = context.conditions;
			const pinTarget = desktop ? pin : stack;
			if (!pinTarget) return;

			gsap.set(Array.from(cards).slice(1), { yPercent: 100 });
			cardChars.forEach((chars) => parkCardText(chars, reducedMotion));

			// Desktop pins the whole body (nav, mark, cards) centred in the
			// viewport rather than flush against its top edge — flush left the
			// block jammed under the top of the screen with a band of empty
			// charcoal below it for the entire deck. Never closer than 120px to
			// the top, so the navbar's MENU pill (top: 40px) stays clear of the
			// cards on short screens where centring alone would push it higher.
			const pinOffset = () => Math.max(120, (window.innerHeight - pin.offsetHeight) / 2);

			// The three-piece mark sits INSIDE the desktop pin, and reveal.js's
			// generic timing ended its break almost exactly as the pin started —
			// the mark was still assembling as card 1 began to move. Ending it at
			// the pin's own start means the logo is whole before the cards begin.
			// Created before the pin's timeline, so its positions are measured
			// without the pin's spacer. Phones pin only the card column (the mark
			// scrolls past above it), so they keep the generic window.
			const mark = section.querySelector("[data-svg-break]");
			if (mark && !reducedMotion && typeof createSvgBreak === "function") {
				createSvgBreak(mark, desktop ? { endTrigger: pin, end: () => `top top+=${pinOffset()}` } : {});
			}

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: pinTarget,
					pin: true,
					// Desktop sits the whole body centred (pinOffset(), above); on
					// mobile the pinned column is only the cards, so it gets a
					// little clearance for the fixed navbar's own MENU button
					// rather than sitting under it. ScrollTrigger parses px but
					// not rem in these strings (see services.js), so these are
					// numbers, not "1rem".
					start: desktop ? () => `top top+=${pinOffset()}` : "top top+=72",
					end: () => `+=${totalUnits * 50}%`,
					scrub: 1,
					invalidateOnRefresh: true,
					onUpdate: (self) => {
						// Card i owns the timeline from the middle of the transition
						// that brings it in to the middle of the one that covers it:
						// its READ stretch sits at i × (READ + TRANS).
						const time = Math.min(Math.max(self.progress, 0), 1) * totalUnits;
						const index = Math.min(cards.length - 1, Math.floor((time + TRANS / 2) / (READ + TRANS)));
						cards.forEach((el, i) => el.classList.toggle("active", i === index));
						navItems.forEach((el, i) => el.classList.toggle("active", i === index));
					},
				},
				defaults: { ease: "none" },
			});

			cards.forEach((card, index) => {
				addCardReveal(tl, cardChars[index], reducedMotion);

				const next = cards[index + 1];
				// The last card is never scaled down — nothing arrives to cover it,
				// the same rule as the /services and /about decks.
				if (!next) return;
				tl.to(card, { scale: 0.9, duration: TRANS });
				tl.to(next, { yPercent: 0, duration: TRANS }, "<");
			});

			// First row starts lit — before any scroll the first card is the one on
			// screen, and onUpdate hasn't fired yet to say so.
			navItems[0]?.classList.add("active");

			return () => {
				tl.scrollTrigger?.kill();
				tl.kill();
				gsap.set(cards, { clearProps: "transform" });
				cardChars.forEach((chars) => chars.length && gsap.set(chars, { clearProps: "opacity,x" }));
				navItems.forEach((el) => el.classList.remove("active"));
			};
		},
	);
}

// Splits each .text-scale-anim heading into per-word / per-letter spans, then
// scales the hovered letter and its two neighbours vertically. Orisa's values
// exactly: 1.6 / -24% for the letter under the cursor, 1.3 / -12% either side,
// 0.4s on a sine ease.
function initTextScaleAnim(root) {
	const headings = root.querySelectorAll(".text-scale-anim");

	headings.forEach((heading) => {
		const nodes = [];
		heading.childNodes.forEach((node) => {
			if (node.nodeType === Node.TEXT_NODE) {
				node.textContent.split(" ").forEach((word, index, array) => {
					const wordSpan = document.createElement("span");
					wordSpan.classList.add("at-word-span");
					word.split("").forEach((letter) => {
						const letterSpan = document.createElement("span");
						letterSpan.classList.add("at-letter-span");
						letterSpan.textContent = letter;
						wordSpan.appendChild(letterSpan);
					});
					nodes.push(wordSpan);
					// Word spans are inline-block, so the whitespace between them has
					// to be re-inserted as its own text node or the words run together.
					if (index < array.length - 1) nodes.push(document.createTextNode(" "));
				});
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				nodes.push(node.cloneNode(true));
			}
		});

		heading.innerHTML = "";
		nodes.forEach((node) => heading.appendChild(node));

		const letters = heading.querySelectorAll(".at-letter-span");
		letters.forEach((letter, index) => {
			const prev = () => letters[index - 1];
			const next = () => letters[index + 1];

			letter.addEventListener("mouseenter", () => {
				gsap.to(letter, { scaleY: 1.6, y: "-24%", duration: 0.4, ease: "sine" });
				[prev(), next()].forEach((el) => {
					if (el) gsap.to(el, { scaleY: 1.3, y: "-12%", duration: 0.4, ease: "sine" });
				});
			});

			letter.addEventListener("mouseleave", () => {
				[letter, prev(), next()].forEach((el) => {
					if (el) gsap.to(el, { scaleY: 1, y: "0%", duration: 0.4, ease: "sine" });
				});
			});
		});
	});
}
