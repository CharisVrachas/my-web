// Four of Orisa's cross-cutting animation helpers — the ones it applies by
// bare class name anywhere on a page rather than per-section. Ported here as
// one module because they behave the same wherever they land, and because
// every future section brought over from the template will want them:
//
//   16. reveal-text        → [data-reveal-text]
//   38. fade-class-active  → [data-fade-anim]
//   28. at-about-svg-wrap  → [data-svg-break]
//   29. at-title-text      → [data-title-flip]
//
// Orisa keys these off CSS classes (.reveal-text, .at_fade_anim,
// .at-about-svg-wrap, .at-title-text). Here they are data attributes,
// matching how every other script in this codebase finds its elements
// ([data-heading], [data-vv], [data-film], [data-services-item]) and keeping
// the class attribute for styling only.
//
// Three of the four are decorative and come off wholesale under
// prefers-reduced-motion — reveal-text in particular starts its characters at
// opacity 0.3 and only scrubs them up to 1 as you scroll, so with the motion
// suppressed the text has to be set solid rather than left dimmed. Title-flip
// is CSS-driven (a plain :hover rule, see footer.css's .footer_connect_char),
// so there's nothing here for reduced-motion to switch off — the DOM prep it
// does (splitting into character spans) is required either way, just inert
// without the CSS transition.
function initReveal() {
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	initRevealText(reduced);
	initFadeAnim(reduced);
	initSvgBreak(reduced);
	initTitleFlip();
}

// Greek capitals carry no accent, and lang="el" (Layout.astro) plus
// text-transform: uppercase gets that right on its own — but only while the
// browser can see the whole word. Every splitter on this site hands it one
// character per element, and an isolated "ή" is the disjunctive "or", which
// keeps its accent by rule: the ή inside "ακινήτων" was coming back as
// "ΑΚΙΝΉΤΩΝ". No other vowel behaves this way (ά έ ί ό ύ ώ all drop the accent
// even alone), and the diaeresis in "ΠΡΟΪΟΝ" is correct where it appears.
//
// Swapping the bare vowel for its unaccented self is enough — the browser
// capitalises it from there — and the split pieces are aria-hidden behind the
// element's own aria-label, so the original wording is what gets read out.
// Runs after every splitter (see app.js), since it does not care which one
// produced the element.
function dropIsolatedTonos() {
	document.querySelectorAll("body *").forEach((el) => {
		if (el.firstElementChild || el.textContent !== "ή") return;
		if (getComputedStyle(el).textTransform !== "uppercase") return;
		el.textContent = "η";
	});
}

// The character reveal runs on titles, and only on titles, at every width.
// Carried across paragraphs and bullets as well it did two things nobody
// wanted. It handed ScrollTrigger a few thousand elements to repaint on every
// scroll frame — /services measured 4051 targets, /about 2254, the home page
// 1896, against under ~500 on the three pages that always scrolled smoothly —
// and it left the reader's actual reading matter sitting faint until they had
// scrolled it bright. Body copy is not animated at all now: solid from first
// paint, matching /pricing, /faq and /contact.
function isRevealTitle(el) {
	return /^H[1-6]$/.test(el.tagName) || /_title\b/.test(el.className || "");
}

// A title's characters. One that initTextScaleAnim() has already broken into
// .at-letter-span letters reuses those rather than being split a second time.
function titleChars(el, splitVars) {
	const letters = el.querySelectorAll(".at-letter-span");
	if (letters.length) return [...letters];
	const split = new SplitText(el, splitVars);
	return split.chars && split.chars.length ? split.chars : [el];
}

// Splits a title to characters and scrubs them from 0.3 opacity to solid as it
// crosses the viewport. Orisa's values: start "top 80%", end "top 20%", scrub
// 1, duration 0.7, stagger 0.2. Anything else carrying the attribute — leads,
// statements, closing lines — is left as it renders.
function initRevealText(reduced) {
	const targets = document.querySelectorAll("[data-reveal-text]");
	if (!targets.length) return;

	if (reduced) {
		gsap.set(targets, { opacity: 1 });
		return;
	}

	targets.forEach((el) => {
		if (!isRevealTitle(el)) return;

		const chars = titleChars(el, {
			type: "lines,words,chars",
			linesClass: "split-line",
		});

		gsap.set(chars, { opacity: 0.3 });

		gsap.to(chars, {
			opacity: 1,
			duration: 0.7,
			stagger: 0.2,
			scrollTrigger: {
				trigger: el,
				start: "top 80%",
				end: "top 20%",
				scrub: 1,
			},
		});
	});
}

// Orisa's generic "fade in from a direction" helper. Every knob is read off
// the element, with the template's own defaults when an attribute is absent:
// 40px offset, 0.75s, from the bottom, 0.15s delay, power2.out.
function initFadeAnim(reduced) {
	const targets = document.querySelectorAll("[data-fade-anim]");
	if (!targets.length || reduced) return;

	targets.forEach((item) => {
		const offset = Number(item.getAttribute("data-fade-offset")) || 40;
		const duration = Number(item.getAttribute("data-duration")) || 0.75;
		const direction = item.getAttribute("data-fade-from") || "bottom";
		const delay = Number(item.getAttribute("data-delay")) || 0.15;
		const ease = item.getAttribute("data-ease") || "power2.out";

		gsap.from(item, {
			opacity: 0,
			ease,
			duration,
			delay,
			x: direction === "left" ? -offset : direction === "right" ? offset : 0,
			y: direction === "top" ? -offset : direction === "bottom" ? offset : 0,
			scrollTrigger: {
				trigger: item,
				start: "top 85%",
			},
		});
	});
}

// The three-piece mark that assembles itself as you scroll past: the left
// face slides in from -100px, the top drops from -100px, the right comes from
// +100px, all scrubbed. Each piece keeps its own transformOrigin so they
// converge on the joint rather than on their own centres.
//
// A section that needs its own timing marks its wrap data-svg-break="manual"
// and calls createSvgBreak() itself — WhyUs does (whyus.js), because its mark
// sits inside a pinned block and has to finish before that pin starts.
function initSvgBreak(reduced) {
	const wraps = document.querySelectorAll("[data-svg-break]");
	if (!wraps.length || reduced) return;

	wraps.forEach((wrap) => {
		if (wrap.dataset.svgBreak !== "manual") createSvgBreak(wrap);
	});
}

// Builds one mark's break. `scrollTrigger` overrides Orisa's own window
// (the wrap's top at 90% of the viewport → its bottom at the centre).
function createSvgBreak(wrap, scrollTrigger = {}) {
	const pieces = [
		{ el: wrap.querySelector("svg:nth-child(1)"), transformOrigin: "left center", x: -100, y: 0 },
		{ el: wrap.querySelector("svg:nth-child(2)"), transformOrigin: "center center", x: 0, y: -100 },
		{ el: wrap.querySelector("svg:nth-child(3)"), transformOrigin: "right center", x: 100, y: 0 },
	];

	pieces.forEach(({ el, transformOrigin, x, y }) => {
		if (!el) return;
		gsap.from(el, {
			transformOrigin,
			x,
			y,
			duration: 1,
			ease: "power2.out",
			scrollTrigger: {
				trigger: wrap,
				start: "top 90%",
				end: "bottom center",
				scrub: 1,
				...scrollTrigger,
			},
		});
	});
}

// ===== Card decks: the one shared character reveal ========================
// Every stacking card deck on the site (WhyUs, /services, /about, /faq) runs
// the same reveal on its cards' titles — Orisa's reveal-text (main.js block
// 16): each character parked at 0.3 opacity, brought up one after another,
// scrubbed to scroll, from the first character on. Markup still marks titles,
// paragraphs and bullet items with data-card-reveal, but only the titles are
// animated (see isRevealTitle above); the rest is left solid. Every deck script
// builds its reveal from these helpers — the same code and the same pacing
// everywhere, not four look-alike copies.
//
// It can't be reveal.js's own [data-reveal-text] handling: that positions
// each element's trigger from where it sits in the document, and the cards of
// a pinned deck are all stacked at the same spot — every card but the first
// would finish revealing before it was ever on screen (which is exactly what
// Orisa's own decks do).
//
// READ is the share of a deck's scrubbed timeline each card spends revealing
// its own text; TRANS is the next card sliding up over it. Every deck pins for
// (cards × READ + transitions × TRANS) × 50% of the viewport's height.
const CARD_REVEAL = { READ: 1, TRANS: 1 };

// A card's [data-card-reveal] text as one reading-order array of characters.
// Words + chars only, not lines: line wrappers are fixed when the split runs
// and would break the wrapping after a resize. A title that
// initTextScaleAnim() has already broken into .at-letter-span letters (the
// hover stretch) reuses those as its characters rather than being split a
// second time — the two effects animate different properties (opacity/x here,
// scaleY/y there), so they don't fight.
function splitCardText(card) {
	const chars = [];
	card.querySelectorAll("[data-card-reveal]").forEach((el) => {
		if (!isRevealTitle(el)) return;
		chars.push(...titleChars(el, { type: "words,chars" }));
	});
	return chars;
}

// Parks a card's characters in reveal-text's start state — or sets them solid
// for visitors who've asked for reduced motion.
//
// Opacity only. Orisa's version also parks each character 7px to the left and
// slides it back, but a card clips to its own box with no left padding of its
// own, so the first character of every line sat 7px outside that edge and was
// shaved in half for as long as the reveal was parked or mid-scrub.
function parkCardText(chars, reduced) {
	if (!chars.length) return;
	gsap.set(chars, { opacity: reduced ? 1 : 0.3 });
}

// Appends one card's READ stretch to a deck's scrubbed timeline. reveal-text's
// own shape is duration 0.7 against stagger 0.2 — about 3.5 characters
// mid-fade at any moment. On a scrubbed timeline duration is share-of-scroll,
// so the step is solved to fill exactly READ: (N − 1)·s + 3.5·s = READ.
// Reduced motion (or a card with nothing to reveal) still spends READ, so
// every deck keeps the identical pace.
function addCardReveal(timeline, chars, reduced) {
	const { READ } = CARD_REVEAL;
	if (!chars.length || reduced) {
		timeline.to({}, { duration: READ });
		return;
	}
	const step = READ / (chars.length + 2.5);
	timeline.to(chars, {
		opacity: 1,
		duration: step * 3.5,
		stagger: { each: step, from: "start" },
		ease: "none",
	});
}

// For a deck that isn't pinned at the current width (FAQ below 992px, whose
// cards sit in normal flow there): each card reveals against its own scroll
// position instead, over reveal-text's own window (top 80% → top 20%).
function addInFlowCardReveal(card, chars, reduced) {
	if (!chars.length || reduced) return;
	gsap.to(chars, {
		opacity: 1,
		duration: 0.7,
		stagger: 0.2,
		ease: "none",
		scrollTrigger: { trigger: card, start: "top 80%", end: "top 20%", scrub: 1 },
	});
}

// Splits text into one <span class="char" style="--char:N"> per character —
// no GSAP, no ScrollTrigger. The animation itself is a plain CSS :hover rule
// (footer.css): each char's text-shadow duplicates it one line-height below,
// and on hover the real glyph slides up to reveal the shadow as if it were a
// second line rolling into place, staggered by the --char index so the
// letters peel up in sequence rather than all at once. This is Orisa's own
// technique — see .at-title-text/.at-title-anim in its compiled main.css.
function initTitleFlip() {
	const targets = document.querySelectorAll("[data-title-flip]");

	targets.forEach((el) => {
		const text = el.textContent.trim();
		el.setAttribute("aria-label", text);
		el.innerHTML = [...text]
			.map((char, i) => {
				const safeChar = char === " " ? "&nbsp;" : char;
				return `<span class="char" aria-hidden="true" style="--char:${i + 1}">${safeChar}</span>`;
			})
			.join("");
	});
}
