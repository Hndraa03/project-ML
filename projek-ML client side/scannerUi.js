function resetData() {
  // 1. Reset Waktu & Timestamp
  const timestampEl = document.getElementById("detection-timestamp");
  if (timestampEl) timestampEl.textContent = "--:--:--";

  // 2. Reset Badge Kategori & Confidence Score
  const badgeEl = document.getElementById("category-badge");
  if (badgeEl) {
    badgeEl.textContent = "Awaiting Scan";
    badgeEl.className =
      "px-3.5 py-1 rounded-full bg-neutral-900 text-neutral-200 text-xs font-bold uppercase tracking-wider shadow-sm";
  }

  const confidenceEl = document.getElementById("confidence-score");
  if (confidenceEl) confidenceEl.textContent = "0% Confidence";

  // 3. Reset Judul & Deskripsi Material
  const materialEl = document.getElementById("detected-material");
  if (materialEl) materialEl.textContent = "No Item Detected";

  const descEl = document.getElementById("detected-desc");
  if (descEl) {
    descEl.textContent =
      "Click 'Start Camera' or 'Snap & Analyze' to begin real-time material classification.";
  }

  // 4. Reset Kotak Rekomendasi Pembuangan
  const disposalInstructions = document.getElementById("disposal-instructions");
  if (disposalInstructions) {
    disposalInstructions.textContent =
      "System standby. Place target material inside the reticle frame.";
  }

  // 6. Memberikan umpan balik visual singkat pada reticle kamera
  const reticle = document.getElementById("scanner-reticle");
  if (reticle) {
    reticle.classList.add("opacity-30");
    setTimeout(() => {
      reticle.classList.remove("opacity-30");
    }, 200);
  }
}

let isCameraActive = false;
let videoStream = null;

const videoEl = document.getElementById("webcam-feed");
const placeholderEl = document.getElementById("camera-placeholder");
const btnLabelEl = document.getElementById("btn-cam-label");
const statusDotEl = document.getElementById("cam-status-dot");
const statusTextEl = document.getElementById("cam-status-text");

async function toggleCamera() {
  if (!isCameraActive) {
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
      });
      videoEl.srcObject = videoStream;
      videoEl.classList.remove("hidden");
      placeholderEl.classList.add("hidden");

      isCameraActive = true;
      btnLabelEl.textContent = "Stop Camera";
      statusDotEl.className =
        "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse";
      statusTextEl.textContent = "Camera Live Feed";
      statusTextEl.className =
        "text-xs font-bold uppercase tracking-wider text-emerald-400";
    } catch (err) {
      alert("Could not access camera. Simulation mode active.");
      placeholderEl.innerHTML = `
            <div class="w-16 h-16 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-800 flex items-center justify-center text-xl animate-pulse mb-2">
              <i class="fa-solid fa-eye"></i>
            </div>
            <p class="text-xs text-neutral-400 font-mono">SIMULATION STREAM ACTIVE</p>
          `;
      isCameraActive = true;
      btnLabelEl.textContent = "Stop Stream";
    }
  } else {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
    }
    videoEl.classList.add("hidden");
    placeholderEl.classList.remove("hidden");
    placeholderEl.innerHTML = `
          <div class="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 text-2xl mb-2">
            <i class="fa-solid fa-camera"></i>
          </div>
          <p class="text-sm text-neutral-300 font-medium">Ready to scan waste material</p>
          <p class="text-xs text-neutral-500 max-w-xs">Position the object clearly within the viewfinder frame for automatic AI detection.</p>
        `;

    isCameraActive = false;
    btnLabelEl.textContent = "Start Camera";
    statusDotEl.className = "w-2.5 h-2.5 rounded-full bg-neutral-400";
    statusTextEl.textContent = "Camera Standby";
    statusTextEl.className =
      "text-xs font-bold uppercase tracking-wider text-neutral-300";
  }
}

const mockDetections = [
  {
    material: "PET Plastic Bottle",
    category: "Anorganic",
    badgeColor: "bg-neutral-800 text-neutral-200 border border-neutral-700",
    confidence: "98.2%",
    desc: "Polyethylene Terephthalate plastic container commonly used for beverages.",
    instructions:
      "Empty liquid contents, rinse with water, crush flat to reduce volume, and place in the ANORGANIC bin.",
  },
  {
    material: "Food Waste / Fruit Peelings",
    category: "Organic",
    badgeColor: "bg-neutral-800 text-neutral-200 border border-neutral-700",
    confidence: "96.7%",
    desc: "Biodegradable organic residual matter from fruit and vegetable prep.",
    instructions:
      "Dispose directly into the ORGANIC compost container or green collection bin.",
  },
  {
    material: "Lithium Ion Battery (AA)",
    category: "Hazardous (B3)",
    badgeColor: "bg-neutral-800 text-neutral-200 border border-neutral-700",
    confidence: "99.1%",
    desc: "Contains toxic metals and chemical electrolytes posing fire hazards.",
    instructions:
      "DO NOT throw in general trash. Seal battery terminals with tape and drop at designated HAZARDOUS e-waste points.",
  },
  {
    material: "Corrugated Cardboard Box",
    category: "Anorganic",
    badgeColor: "bg-neutral-800 text-neutral-200 border border-neutral-700",
    confidence: "94.5%",
    desc: "Clean paperboard product suitable for mechanical pulping and paper recycling.",
    instructions:
      "Remove plastic packing tape, flatten box panels, and place in dry paper/anorganic collection.",
  },
];

function triggerScan() {
  const now = new Date();
  document.getElementById("detection-timestamp").textContent =
    now.toLocaleTimeString();

  const reticle = document.getElementById("scanner-reticle");
  reticle.classList.add("border-white", "scale-[1.01]");
  setTimeout(
    () => reticle.classList.remove("border-white", "scale-[1.01]"),
    300,
  );

  const item =
    mockDetections[Math.floor(Math.random() * mockDetections.length)];

  document.getElementById("detected-material").textContent = item.material;
  document.getElementById("detected-desc").textContent = item.desc;
  document.getElementById("confidence-score").textContent =
    item.confidence + " Match";
  document.getElementById("disposal-instructions").textContent =
    item.instructions;

  const badge = document.getElementById("category-badge");
  badge.textContent = item.category;
  badge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.badgeColor}`;
}
