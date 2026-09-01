// 1. MATIKAN SCROLL RESTORATION BROWSER & PAKSA KE TOP (0, 0)
if (history.scrollRestoration) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

window.addEventListener("DOMContentLoaded", () => {
  // Pastikan posisi benar-benar di atas saat mulai
  window.scrollTo(0, 0);
  document.body.style.overflow = "hidden";

  gsap.registerPlugin(ScrollTrigger);

  // Pastikan ScrollTrigger mulai dari posisi 0
  ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory("manual");

  const words = document.querySelectorAll(".loader-word");

  // ================= PRELOADER TIMELINE =================
  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
  });

  // Animasi kata loader
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

  // Slide-up preloader
  tl.to(
    "#loader",
    {
      yPercent: -100,
      duration: 1,
      ease: "expo.inOut",
      onComplete: () => {
        // Buka scroll
        document.body.style.overflow = "";

        // Paksa scroll tetap di top sebelum ScrollTrigger menghitung layout
        window.scrollTo(0, 0);

        // Inisialisasi animasi ScrollTrigger setelah intro selesai
        initScrollAnimations();

        // Refresh perhitungan posisi
        ScrollTrigger.refresh();
      },
    },
    "-=0.1",
  );

  // Reveal elemen hero
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
    const navbar = document.getElementById("navbar");

    // ================= 1. HIDE ON SCROLL DOWN / SHOW ON SCROLL UP =================
    ScrollTrigger.create({
      start: "top top",
      end: "max",
      onUpdate: (self) => {
        // self.direction: 1 = scroll ke bawah, -1 = scroll ke atas
        if (self.direction === 1 && self.scroll() > 50) {
          // Sembunyikan navbar ke atas layar
          gsap.to(navbar, {
            yPercent: -100,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          // Tampilkan kembali navbar
          gsap.to(navbar, {
            yPercent: 0,
            duration: 0.35,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      },
    });

    // ================= 2. MENYESUAIKAN WARNA NAVBAR DENGAN SECTION =================

    // Saat Masuk ke Section 2 (Gelap -> Navbar Hitam Solid + Teks Putih)
    ScrollTrigger.create({
      trigger: "#section-parallax",
      start: "top 20px",
      onEnter: () => {
        gsap.to(navbar, {
          backgroundColor: "transparent",
          color: "#ffffff",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          duration: 0.4,
        });
      },
      onLeaveBack: () => {
        // Kembali ke Section 1 (Paling atas -> Transparan + Teks Hitam)
        gsap.to(navbar, {
          backgroundColor: "transparent",
          color: "#111111",
          borderBottom: "1px solid transparent",
          duration: 0.4,
        });
      },
    });

    // Saat Masuk ke Section 3 (Terang -> Navbar Krem/Putih Solid + Teks Hitam)
    ScrollTrigger.create({
      trigger: "#section-3",
      start: "top 80px",
      onEnter: () => {
        gsap.to(navbar, {
          backgroundColor: "transparent",
          color: "#111111",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          duration: 0.4,
        });
      },
      onLeaveBack: () => {
        // Scroll balik ke Section 2 (Gelap -> Latar Hitam + Teks Putih)
        gsap.to(navbar, {
          backgroundColor: "transparent",
          color: "#ffffff",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          duration: 0.4,
        });
      },
    });

    // ================= 3. PIN SECTION 1 & OVERLAP TRANSITION =================
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
  }
});
