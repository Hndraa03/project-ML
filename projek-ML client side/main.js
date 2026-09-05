// 1. MATIKAN SCROLL RESTORATION BROWSER & PAKSA KE TOP (0, 0)
if (history.scrollRestoration) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

window.addEventListener("DOMContentLoaded", () => {
  window.scrollTo(0, 0);
  document.body.style.overflow = "hidden";

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory("manual");

  const words = document.querySelectorAll(".loader-word");

  // ================= PRELOADER TIMELINE =================
  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
  });

  words.forEach((word) => {
    tl.to(word, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: "power2.out",
    }).to(word, {
      opacity: 0,
      y: -20,
      duration: 0.5,
      delay: 0.5,
      ease: "power2.in",
    });
  });

  tl.to(
    "#loader",
    {
      yPercent: -100,
      duration: 1,
      ease: "expo.inOut",
      onComplete: () => {
        document.body.style.overflow = "";
        window.scrollTo(0, 0);
        initScrollAnimations();
        ScrollTrigger.refresh();
      },
    },
    "-=0.1",
  );

  tl.to(
    ".hero-elem",
    {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power4.out",
    },
    "-=0.6",
  );

  // ================= FUNGSI ANIMASI SCROLL =================
  function initScrollAnimations() {
    // ================= 3. PIN SECTION HERO & OVERLAP =================
    ScrollTrigger.create({
      trigger: "#hero",
      start: "top top",
      end: "bottom top",
      pin: true,
      pinSpacing: false,
    });

    gsap.to("#hero-content", {
      scale: 0.92,
      y: 50,
      ease: "none",
      scrollTrigger: {
        trigger: "#section-parallax",
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    });

    gsap.to("#hero-dimmer", {
      opacity: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#section-parallax",
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    });

    // ================= 4. PARALLAX SECTION 2 =================
    const parallaxTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-parallax",
        start: "top top",
        end: "+=120%",
        pin: true,
        scrub: 1.2,
        anticipatePin: 1,
      },
    });

    parallaxTimeline.fromTo(
      "#parallax-text",
      { opacity: 0, y: 100, scale: 0.9, filter: "blur(6px)" },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.5,
        ease: "power2.out",
      },
    );

    document.querySelectorAll(".parallax-elem").forEach((elem) => {
      const speed = parseFloat(elem.getAttribute("data-speed")) || 60;
      parallaxTimeline.to(elem, { y: speed, ease: "none" }, 0);
    });

    // ================= 5. ANIMASI SECTION 3 =================
    gsap.to(".sec3-title, .sec3-desc", {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#section-3",
        start: "top 80%",
      },
    });

    gsap.to(".sec4-title, .sec4-desc", {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#section-4",
        start: "top 80%",
      },
    });

    // 2. Animasi Cards (Tanpa menyentuh SVG)
    gsap.fromTo(
      ".sec4-card",
      {
        opacity: 0,
        y: 80,
      },
      {
        opacity: 1,
        y: (i) => {
          // Menjaga layout bertingkat (lg:-translate-y-6 & lg:translate-y-6) pada desktop
          if (window.innerWidth >= 1024) {
            return i === 1 ? 24 : -24; // 24px sejajar dengan class translate-y-6
          }
          return 0;
        },
        duration: 0.9,
        stagger: 0.3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#section-4",
          start: "top 70%",
        },
      },
    );

    gsap.fromTo(
      ".sec3-card",
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: "#section-3",
          start: "top 70%",
        },
      },
    );

    // ================= 6. FOOTER OVERLAP & PARALLAX (SEPERTI HERO) =================
    // Pin section sebelum footer (#section-5) agar diam di tempat saat Footer meluncur naik
    ScrollTrigger.create({
      trigger: "#section-5",
      start: "bottom bottom",
      end: "bottom top",
      pin: true,
      pinSpacing: false,
    });

    // Efek menyusut & meredup pada Section 5 saat Footer mulai menutupi
    gsap.to("#section-5", {
      scale: 0.94,
      opacity: 0.4,
      ease: "none",
      scrollTrigger: {
        trigger: "#footer",
        start: "top bottom",
        end: "top top",
        scrub: true,
      },
    });
  }
});

// ================= NAVBAR HIDE/SHOW ON SCROLL =================
let lastScrollY = window.scrollY;
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  const currentScrollY = window.scrollY;

  if (currentScrollY > lastScrollY && currentScrollY > 100) {
    navbar.classList.add("-translate-y-full");
  } else {
    navbar.classList.remove("-translate-y-full");
  }

  lastScrollY = currentScrollY;
});
