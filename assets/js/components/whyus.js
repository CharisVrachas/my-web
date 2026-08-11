// Ported from two blocks of Orisa's main.js:
//   32. section-fix (pin section-title + stacking cards)
//   21. text-scale-anim
//
// The stacking timeline is Orisa's, tween for tween: every card after the
// first starts at yPercent 100, the pin runs for `cards.length * 50`% of
// viewport height, and each step scales the outgoing card to 0.9 while
// bringing the next one up to yPercent 0 at the same position ("<"). The
// nav's active row is set from the timeline's own progress in onUpdate, which
// is why it can never drift out of sync with the card on top.
//
// Two things had to change on the way in, neither of them behavioural:
//   - Orisa re-runs its active-row update on every ScrollTrigger 'scroll'
//     event as well as in onUpdate. That was there to cover the case where
//     scroll happens without the timeline updating; with ScrollSmoother
//     driving scroll here, onUpdate already fires on every frame the pin is
//     active, so the extra global listener is redundant — and it was a leak,
//     since nothing ever removed it.
//   - text-scale-anim bound its per-letter hover with jQuery. Same two
//     events, addEventListener instead.
function initWhyUs() {
	const section = document.querySelector(".section_whyus");
	if (!section) return;

	initWhyUsStack(section);
	initTextScaleAnim(section);
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

	// The deck now runs at EVERY width, not just ≥992px. It used to be gated
	// off on the grounds that a phone has no room for it — true of the
	// desktop shape of the effect, which pins .whyus_pin, i.e. the numbered
	// nav column AND the three-piece mark AND the cards all together. On a
	// phone .whyus_body is a single column, so pinning that wrapper means
	// holding the mark and the cards on screen at once, and the cards alone
	// already fill most of a phone viewport.
	//
	// Pinning .whyus_stack instead is what makes it fit: the mark scrolls in
	// and breaks apart normally on its way past (reveal.js's own
	// [data-svg-break], untouched), then the card column alone pins and deals
	// the five cards over one another exactly as on desktop. Same timeline,
	// same tween values, same "like a deck" read — only the pinned element
	// differs per width, which is the one thing that genuinely had to.
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

			const scrollDistance = cards.length * 50;

			const tl = gsap.timeline({
				scrollTrigger: {
					trigger: pinTarget,
					pin: true,
					// Desktop holds the whole body flush to the top of the
					// viewport; on mobile the pinned column is only the cards, so
					// it gets a little clearance for the fixed navbar's own MENU
					// button rather than sitting under it. ScrollTrigger parses px
					// but not rem in these strings (see services.js), so this is a
					// number, not "1rem".
					start: desktop ? "top top" : "top top+=72",
					end: () => `+=${scrollDistance}%`,
					scrub: 1,
					invalidateOnRefresh: true,
					onUpdate: (self) => {
						// Clamped just below 1 so the final frame still maps into the
						// last card's slot instead of overflowing the array.
						const progress = Math.min(Math.max(self.progress, 0), 0.9999);
						const index = Math.min(Math.floor(progress * cards.length), cards.length - 1);
						cards.forEach((el, i) => el.classList.toggle("active", i === index));
						navItems.forEach((el, i) => el.classList.toggle("active", i === index));
					},
				},
				defaults: { ease: "none", duration: 1 },
			});

			cards.forEach((card, index) => {
				tl.to(card, { scale: 0.9 });
				if (cards[index + 1]) {
					tl.to(cards[index + 1], { yPercent: 0 }, "<");
				}
			});

			// First row starts lit — before any scroll the first card is the one on
			// screen, and onUpdate hasn't fired yet to say so.
			navItems[0]?.classList.add("active");

			return () => {
				tl.scrollTrigger?.kill();
				tl.kill();
				gsap.set(cards, { clearProps: "transform" });
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
