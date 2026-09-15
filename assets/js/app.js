function onReady() {
	registerPlugins();
	initSmoother();
	initGsapDefaults();
	initHero();
	initAbout();
	initServices();
	initWhyUs();
	// Home only — no-op elsewhere (guarded on [data-local]).
	initLocalPresence();
	initTestimonials();
	// /services only — no-ops on the home page (guarded on [data-sv-stack]).
	// Before initFooter() for the same reason as the sections above it: the
	// footer's placeholder height is measured from a page whose own pinned
	// sections have already registered their scroll distance.
	initServicesPage();
	// /about only — no-ops on every other page (guarded on [data-as-stack]).
	initAboutStory();
	// (No /pricing-specific init anymore — its old Personal/Business toggle
	// was removed along with pricing-page.js's own function; see that file.)
	// /faq only — both no-op on every other page.
	initFaqAccordion();
	initFaqStack();
	// /contact only — all three no-op everywhere else.
	initContactBanner();
	initContactRotate();
	initForm();
	// Needs #smooth-content main to exist, which is why index.astro wraps every
	// section in <main> now — see Footer.astro's file-level comment for why.
	initFooter();
	// After the sections that own the elements it animates — initReveal() runs
	// SplitText over [data-reveal-text], and WhyUs's own text-scale-anim also
	// rewrites headings, so the order matters: whichever splits last owns the
	// resulting spans.
	initReveal();
	initNavbar();
	initNavCompact();
	initHeadings();
	initNavScroll();
	initPageTransition();
	// initHistory() is only called once Lineage is ported — the script that
	// defines it isn't loaded yet, so calling it here would throw and abort
	// the rest of this function. (initForm() used to be in this same
	// boat; it's real now, called above with the rest of /contact's own.)
	//
	// initPreloader() is not called here: preloader.js starts itself (on
	// window load, with a 2.5s fallback timer) so the loader can begin before
	// DOMContentLoaded even fires.

	// The webfonts use font-display: block, so first layout can be measured with
	// fallback metrics. Anything sized from text width (the definitions blocks,
	// SplitText line breaks) has to be recalculated once the real fonts land.
	document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", onReady);
} else {
	onReady();
}
