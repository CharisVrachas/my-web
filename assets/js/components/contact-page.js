// /contact — three independent pieces, each guarded on its own target so
// this file is a no-op everywhere else.

// The banner's zoom — Orisa's own "scroll-scale-up-img" (main.js block 23):
// scales .scale-up from 1 to 1.15 as .scale-up-img scrolls from entering the
// viewport to reaching its centre. Separate from the drift the same <img>
// already gets from its own data-speed attribute (a ScrollSmoother effect,
// core.js) — the two run independently and layer correctly.
function initContactBanner() {
	const section = document.querySelector(".scale-up-img");
	if (!section) return;
	const target = section.querySelector(".scale-up");
	if (!target) return;

	gsap.timeline({
		scrollTrigger: {
			trigger: section,
			start: "top bottom",
			end: "bottom center",
			scrub: 1,
		},
	}).to(target, { scale: 1.15, duration: 1 });
}

// The small rotating cross beside "Get in touch" — Orisa's own
// "scroll-rotate" (main.js block 53): a plain 720° rotation scrubbed to the
// element's own position, no start/end configured, so ScrollTrigger falls
// back to its default (roughly the element crossing the viewport once).
function initContactRotate() {
	const el = document.querySelector(".ct_rotate");
	if (!el) return;

	gsap.to(el, {
		scrollTrigger: { trigger: el, scrub: 2 },
		rotation: 720,
	});
}

// The contact form. Orisa's own markup posts to action="#" — there was
// never a real endpoint behind it in the template, and there isn't one here
// either yet. Letting the browser actually submit to "#" would POST to the
// current URL and reload the page, silently discarding whatever the owner
// typed with no feedback at all — worse than doing nothing. This intercepts
// that: runs the browser's own required-field validation, and on success
// shows an inline confirmation instead of navigating anywhere.
//
// TODO: replace the body of the "success" branch with a real submission
// (fetch() to a form-handling endpoint, or a mailto:/service like Formspree)
// once Minos Host has one. Nothing here pretends a message was actually
// sent anywhere — the confirmation text says so explicitly.
function initForm() {
	const form = document.getElementById("contact-form");
	if (!form) return;

	const success = form.querySelector(".ct_form_success");

	form.addEventListener("submit", (e) => {
		e.preventDefault();

		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		if (success) {
			success.hidden = false;
			success.scrollIntoView({ block: "nearest", behavior: "smooth" });
		}
		form.reset();
	});
}
