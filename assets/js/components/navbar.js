// Ported from main.js's "08. mobile menu Js" block, specifically the
// px-offcanvas-2-area open/close pair — jQuery there, plain DOM here, same
// two-class mechanic. The reveal itself (the circle growing, the links
// cascading in) is pure CSS transition, keyed off .is-open — see the
// .menu2_* rules in navbar.css. This function only owns the two classes and
// the bookkeeping around them (aria state, scroll lock, Escape/outside-click
// to close).
//
// .is-closing is Orisa's own .menu-open-temp: .is-open flips .menu2_bg's
// clip-path back down to 0% immediately, but .menu2_area itself (position:
// fixed; right: 0) needs to stay put for the full 0.7s that takes, or the
// container would snap back to left: 100% before the circle had shrunk at
// all — the menu would just disappear instead of closing. 800ms is the
// hold now: the slowest thing closing is .menu2_bg's own 0.7s circle
// shrink (navbar.css), with the nav links themselves fading out faster
// still (0.4s, the .is-closing rule in navbar.css) — 800ms clears both
// with a small margin, rather than the original 2000ms, which was sized
// for the OLD entrance stagger (2.3s delay + 1.5s duration) leaking into
// the close direction. It no longer does — see navbar.css's .is-closing
// rule — so holding for that long here just left the panel sitting inert,
// still catching clicks/occupying the corner, for a second longer than
// anything was actually still animating.
function initNavbar() {
	const navbar = document.querySelector(".u-navbar");
	const menu = document.querySelector(".menu2_area");
	const toggles = document.querySelectorAll("[data-navbar-toggle]");
	if (!navbar || !menu) return;

	let closeTimeout;

	function openMenu() {
		clearTimeout(closeTimeout);
		menu.classList.remove("is-closing");
		menu.classList.add("is-open");
		navbar.classList.add("active");
		toggles.forEach((btn) => btn.setAttribute("aria-expanded", "true"));
		window.smoother?.paused(true);
		document.addEventListener("touchmove", preventScroll, { passive: false });
	}

	function closeMenu() {
		menu.classList.remove("is-open");
		menu.classList.add("is-closing");
		navbar.classList.remove("active");
		toggles.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
		window.smoother?.paused(false);
		document.removeEventListener("touchmove", preventScroll);
		clearTimeout(closeTimeout);
		closeTimeout = setTimeout(() => menu.classList.remove("is-closing"), 800);
	}

	function preventScroll(e) {
		if (!e.target.closest(".menu2_area")) e.preventDefault();
	}

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
	});
	document.addEventListener("click", (e) => {
		if (!menu.classList.contains("is-open")) return;
		const isMenuButton = Array.from(toggles).some((btn) => btn.contains(e.target));
		if (isMenuButton) return;
		const isInsideMenu = e.target.closest(".menu2_area");
		const isLinkInsideMenu = e.target.closest(".menu2_nav_link, .menu2_logo");
		if (isLinkInsideMenu || !isInsideMenu) closeMenu();
	});
	toggles.forEach((btn) => {
		btn.addEventListener("click", () => {
			if (menu.classList.contains("is-open")) closeMenu();
			else openMenu();
		});
	});
}

// Swaps the header bar (logo, centred menu, grid button) for the lone
// "MENU" pill once you've scrolled past the top — Orisa's own header simply
// scrolls away and leaves that pill behind; this navbar is fixed, so
// .is-compact recreates the same end state (see navbar.css). It also keeps
// the fixed bar from colliding with the fixed footer's top row once the
// footer's own reveal starts (footer.js).
function initNavCompact() {
	const navbar = document.querySelector(".u-navbar");
	if (!navbar) return;

	// .is-leaving-compact is what lets the MENU button fade OUT instead of
	// snapping away — see the comment on .u-navbar.is-leaving-compact
	// .u-menu-btn in navbar.css for why the class needs to survive past the
	// moment .is-compact itself comes off. 300ms matches that rule's own
	// transition duration; the inline links/logo fade on plain CSS (their
	// own transition, no JS timing needed) so only this button needs it.
	let leaveTimeout;
	ScrollTrigger.create({
		trigger: document.body,
		start: "top top-=100",
		onEnter: () => {
			clearTimeout(leaveTimeout);
			navbar.classList.remove("is-leaving-compact");
			navbar.classList.add("is-compact");
		},
		onLeaveBack: () => {
			navbar.classList.remove("is-compact");
			navbar.classList.add("is-leaving-compact");
			clearTimeout(leaveTimeout);
			leaveTimeout = setTimeout(() => navbar.classList.remove("is-leaving-compact"), 300);
		},
	});
}

function initNavScroll() {
	window.smootherReady.then(() => {
		const mm = gsap.matchMedia();
		mm.add(
			{
				isDesktop: "(min-width: 992px)",
				isMobile: "(max-width: 991px)",
			},
			(context) => {
				let { isDesktop } = context.conditions;
				const navLinks = document.querySelectorAll('[data-nav-link][href^="#"]');
				let scrollOffsets;
				if (isDesktop) {
					scrollOffsets = {
						"#hero": { target: "body", offset: 0 },
						"#vv": { target: ".hero_stack_wrapper", offset: window.innerHeight },
						"#films": { target: ".hero_stack_wrapper", offset: window.innerHeight * 2 },
						"#about": { target: ".about_stack_wrapper", offset: 0 },
						"#pillars": { target: ".about_stack_wrapper", offset: window.innerHeight * 3 },
						"#history": { target: ".section_history", offset: 0 },
						"#contact": { target: ".section_footer", offset: 0 },
					};
				} else {
					scrollOffsets = {
						"#hero": { target: "body", offset: 0 },
						"#vv": { target: "body", offset: window.innerHeight * 2.25 },
						"#films": { target: "body", offset: window.innerHeight * 3.3 },
						"#about": { target: ".about_stack_wrapper", offset: 0 },
						"#pillars": { target: ".about_stack_wrapper", offset: window.innerHeight },
						"#history": { target: ".section_history", offset: 0 },
						"#contact": { target: ".section_footer", offset: 0 },
					};
				}
				navLinks.forEach((link) => {
					link.addEventListener("click", (e) => {
						e.preventDefault();
						const targetId = link.getAttribute("href");
						const config = scrollOffsets[targetId];
						const targetEl = document.querySelector(config ? config.target : targetId);
						if (!targetEl || !window.smoother) return;
						const targetScroll =
							window.smoother.offset(targetEl, "top top") + (config?.offset ?? 0);
						gsap.to(window.smoother, {
							scrollTop: targetScroll,
							duration: 2,
							ease: "expo.inOut",
							overwrite: true,
						});
					});
				});
			},
		);
	});
}
