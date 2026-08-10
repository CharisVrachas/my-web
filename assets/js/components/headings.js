function initHeadings() {
	let splitHeading = SplitText.create("[data-heading]", {
		types: "lines",
		mask: "lines",
		linesClass: "line",
	});
	gsap.set(".line", {
		paddingTop: "0.1em",
		paddingBottom: "0.1em",
		marginTop: "-0.1em",
	});
	function createScrollTrigger(triggerElement, timeline) {
		ScrollTrigger.create({
			trigger: triggerElement,
			start: "top bottom",
			onLeaveBack: () => {
				timeline.progress(0);
				timeline.pause();
			},
		});
		ScrollTrigger.create({
			trigger: triggerElement,
			start: "top 80%",
			onEnter: () => timeline.play(),
		});
	}
	document.querySelectorAll("[data-heading]").forEach((el) => {
		let tlHeading = gsap.timeline({ paused: true });
		tlHeading.from(el.querySelectorAll(".line"), {
			yPercent: 100,
			opacity: 0,
			duration: 1,
			ease: "power4.out",
			stagger: 0.05,
		});
		createScrollTrigger(el, tlHeading);
	});
	document.querySelectorAll("[data-body]").forEach((el) => {
		let tlBody = gsap.timeline({ paused: true });
		tlBody.from(el, {
			opacity: 0,
			duration: 1,
			ease: "power4.out",
		});
		createScrollTrigger(el, tlBody);
	});
}
