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

// Splits a heading to characters and scrubs them from 0.3 opacity / -7px to
// solid as the heading crosses the viewport. Orisa's values exactly: start
// "top 80%", end "top 20%", scrub 1, duration 0.7, stagger 0.2.
function initRevealText(reduced) {
	const targets = document.querySelectorAll("[data-reveal-text]");
	if (!targets.length) return;

	if (reduced) {
		gsap.set(targets, { opacity: 1 });
		return;
	}

	targets.forEach((el) => {
		const split = new SplitText(el, {
			type: "lines,words,chars",
			linesClass: "split-line",
		});

		if (!split.chars || !split.chars.length) return;

		gsap.set(split.chars, { opacity: 0.3, x: -7 });

		gsap.to(split.chars, {
			x: 0,
			y: 0,
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
function initSvgBreak(reduced) {
	const wraps = document.querySelectorAll("[data-svg-break]");
	if (!wraps.length || reduced) return;

	wraps.forEach((wrap) => {
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
				},
			});
		});
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
