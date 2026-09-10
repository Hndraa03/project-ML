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

    // ================= 6. FOOTER OVERLAP & PARALLAX =================
    ScrollTrigger.create({
      trigger: "#section-5",
      start: "bottom bottom",
      end: "bottom top",
      pin: true,
      pinSpacing: false,
    });

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

// ================= MODAL / POPUP FUNCTION =================
const detailPopUp = document.getElementById("detailPopUp");

function showDetail(type) {
  let title = "";
  let description = "";
  let examples = "";
  let icon = "";

  if (type === "organic") {
    title = "organic";
    description =
      "Organic waste is waste that comes from plants, animals, or other living things. This type of waste can decompose naturally with the help of microorganisms. Organic waste is usually found in kitchens, gardens, and food areas.";
    examples = "Food scraps, fruit peels, dry leaves, and vegetables.";
    icon = `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="42" height="42" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M2 22c1.25-.987 2.27-1.975 3.9-2.2a5.56 5.56 0 0 1 3.8 1.5 4 4 0 0 0 6.187-2.353 3.5 3.5 0 0 0 3.69-5.116A3.5 3.5 0 0 0 20.95 8 3.5 3.5 0 1 0 16 3.05a3.5 3.5 0 0 0-5.831 1.373 3.5 3.5 0 0 0-5.116 3.69 4 4 0 0 0-2.348 6.155C3.499 15.42 4.409 16.712 4.2 18.1 3.926 19.743 3.014 20.732 2 22"/>
        <path d="M2 22 17 7"/>
      </svg>
    `;
  } else if (type === "anorganic") {
    title = "anorganic";
    description =
      "Anorganic waste is waste that does not come from living things and is difficult to decompose naturally. Some inorganic waste can be reused or recycled into new products. If it is not managed properly, it can pollute the environment.";
    examples = "Plastic, bottles, cans, glass, and cardboard.";
    icon = `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="42" height="42" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M18 11h-4a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h4"/>
        <path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"/>
        <rect width="16" height="5" x="4" y="2" rx="1"/>
      </svg>
    `;
  } else if (type === "b3") {
    title = "hazardous waste";
    description =
      "B3 waste is waste that contains hazardous or toxic materials. This type of waste can be dangerous to people, animals, and the environment if it is handled or disposed of carelessly. Therefore, B3 waste needs to be separated from other types of waste and handled properly.";
    examples =
      "Used batteries, fluorescent lamps, expired medicine, paint, and pesticides.";
    icon = `
      <svg xmlns="http://www.w3.org/2000/svg"
        width="42" height="42" viewBox="0 0 24 24"
        fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round"
        stroke-linejoin="round">
        <path d="m11 7-3 5h4l-3 5"/>
        <path d="M14.856 6H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.935"/>
        <path d="M22 14v-4"/>
        <path d="M5.14 18H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2.936"/>
      </svg>
    `;
  }

  detailPopUp.innerHTML = `
    <div 
      class="relative w-full max-w-lg
             bg-[#e3ded4]
             border-t border-l border-black/10
             rounded-4xl
             shadow-2xl
             p-7 md:p-9
             transform transition-all duration-300"
      onclick="event.stopPropagation()"
    >

      <!-- Icon -->
      <div
        class="w-20 h-20
               flex items-center justify-center
               bg-[#e8e3d8]
               rounded-3xl
               border border-black/5
               mb-7"
      >
        ${icon}
      </div>

      <!-- Small Label -->
      <p class="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-2">
        waste category
      </p>

      <!-- Title -->
      <h2 class="text-4xl md:text-5xl font-black tracking-tighter text-[#111] mb-5">
        ${title}
      </h2>

      <!-- Divider -->
      <div class="w-full h-px bg-black/10 mb-6"></div>

      <!-- Description -->
      <div class="mb-6">
        <p class="text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-2">
          description
        </p>
        <p class="text-sm md:text-base text-slate-600 leading-relaxed">
          ${description}
        </p>
      </div>

      <!-- Examples -->
      <div class="bg-[#dad4c7]/60 border border-black/5 rounded-2xl p-5">
        <p class="text-[11px] uppercase tracking-widest font-bold text-slate-500 mb-2">
          examples
        </p>
        <p class="text-sm text-[#111] leading-relaxed font-medium">
          ${examples}
        </p>
      </div>

      <!-- Bottom -->
      <div class="mt-7 pt-5 border-t border-black/10 flex items-center justify-between">
        <span class="text-xs text-slate-500 uppercase tracking-widest">
          ecoSort
        </span>
        <button
          onclick="closeDetail()"
          class="px-6 py-2.5 rounded-full bg-[#111] text-[#e3ded4] text-sm font-medium hover:bg-neutral-800 transition-colors duration-300"
        >
          close
        </button>
      </div>
    </div>
  `;

  detailPopUp.classList.replace("hidden", "flex");
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  detailPopUp.classList.replace("flex", "hidden");
  detailPopUp.innerHTML = "";
  document.body.style.overflow = "";
}
