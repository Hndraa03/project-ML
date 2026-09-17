"use strict";

/* --------------------------------------------------------------------- *
 * Configuration
 * (padanan dari dataclass Config pada versi Python)
 * --------------------------------------------------------------------- */
const Config = {
  modelPath: "/model/model.json",
  metadataPath: "/model/metadata.json",

  frameWidth: 640,
  frameHeight: 480,

  inputSize: [224, 224],
  normalizeScale: 127.5,
  normalizeOffset: 1.0,

  marginRatioX: 0.25,
  marginRatioY: 0.2,
  blurPx: 12, // padanan kasar dari cv2.GaussianBlur((21,21))

  bufferSize: 5,
  confidenceThreshold: 0.88,

  ignoreLabels: ["background", "kosong"],

  // Hanya label yang mengandung salah satu kata kunci ini yang akan
  // ditampilkan sebagai hasil deteksi. Selain itu dianggap "tidak ada benda".
  allowedCategories: ["anorganik", "organik"],

  // --- Deteksi keberadaan benda (mencegah ruangan/latar kosong ikut terdeteksi) ---
  bgSampleSize: 32, // ukuran downsample untuk perbandingan latar (px x px)
  bgDiffThreshold: 14, // makin kecil = makin sensitif mendeteksi perubahan
  calibrationFrames: 20, // jumlah frame dipakai untuk merekam latar belakang kosong

  // Warna (format CSS rgb): Anorganik = MERAH, Organik = HIJAU
  categoryColors: {
    anorganik: "rgb(255,0,0)",
    organik: "rgb(0,255,0)",
    b3: "rgb(255,165,0)",
  },
  defaultColor: "rgb(255,255,255)",
  idleColor: "rgb(255,255,255)",

  // Teks bantuan untuk panel "Analysis Output" di scaner.html
  categoryInfo: {
    anorganik: {
      badge: "Anorganic",
      badgeColor:
        "bg-amber-900 text-amber-300 border border-amber-700/50",
      desc: "Material anorganik terdeteksi (plastik, logam, kaca, kertas, dsb).",
      instructions:
        "Pisahkan dari sisa makanan, bilas bila kotor, lalu buang ke tempat sampah ANORGANIK / daur ulang.",
    },
    organik: {
      badge: "Organic",
      badgeColor:
        "bg-emerald-900 text-emerald-300 border border-emerald-700/50",
      desc: "Material organik terdeteksi (sisa makanan, daun, bahan alami, dsb).",
      instructions:
        "Buang langsung ke tempat sampah ORGANIK / komposter.",
    },
  },
};

/* --------------------------------------------------------------------- *
 * Model Wrapper
 * (padanan dari class WasteClassifier)
 * --------------------------------------------------------------------- */
class WasteClassifier {
  constructor(cfg) {
    this.cfg = cfg;
    this.model = null;
    this.classNames = [];
  }

  async load() {
    // Model hasil export "Tensorflow.js" dari Teachable Machine:
    // model.json + weights.bin (dimuat otomatis oleh tf.loadLayersModel)
    this.model = await tf.loadLayersModel(this.cfg.modelPath);

    const res = await fetch(this.cfg.metadataPath);
    const metadata = await res.json();
    this.classNames = metadata.labels; // urutan label sudah sesuai output model
  }

  // Menerima sebuah <canvas> berisi crop (canvas selalu RGBA di JS,
  // jadi tidak perlu konversi BGR->RGB seperti pada versi OpenCV/Python).
  preprocess(cropCanvas) {
    return tf.tidy(() => {
      let img = tf.browser.fromPixels(cropCanvas); // RGB, HxWx3
      img = tf.image.resizeBilinear(img, this.cfg.inputSize);
      img = img.toFloat();
      img = img.div(this.cfg.normalizeScale).sub(this.cfg.normalizeOffset);
      return img.expandDims(0); // 1xHxWx3
    });
  }

  async predict(cropCanvas) {
    const tensor = this.preprocess(cropCanvas);
    const outputTensor = this.model.predict(tensor); // tf.LayersModel
    const scores = await outputTensor.data(); // Float32Array
    tf.dispose([tensor, outputTensor]);
    return scores;
  }
}

/* --------------------------------------------------------------------- *
 * Background Gate
 * Mendeteksi apakah ada benda di dalam kotak fokus, dengan membandingkan
 * frame saat ini terhadap referensi latar belakang kosong yang direkam
 * saat kalibrasi. Kalau tidak ada perbedaan berarti, dianggap kotak kosong
 * (ruangan/latar saja) dan TIDAK dikirim ke model klasifikasi.
 * --------------------------------------------------------------------- */
class BackgroundGate {
  constructor(cfg) {
    this.cfg = cfg;
    this.reference = null; // Float32Array grayscale hasil downsample
    this._tmpCanvas = document.createElement("canvas");
    this._tmpCanvas.width = cfg.bgSampleSize;
    this._tmpCanvas.height = cfg.bgSampleSize;
    this._tmpCtx = this._tmpCanvas.getContext("2d", {
      willReadFrequently: true,
    });
  }

  _downsampleGray(cropCanvas) {
    const size = this.cfg.bgSampleSize;
    this._tmpCtx.drawImage(cropCanvas, 0, 0, size, size);
    const data = this._tmpCtx.getImageData(0, 0, size, size).data;
    const gray = new Float32Array(size * size);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gray[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return gray;
  }

  reset() {
    this.reference = null;
  }

  // Dipanggil berulang selama fase kalibrasi (kotak harus kosong)
  calibrate(cropCanvas) {
    const gray = this._downsampleGray(cropCanvas);
    if (!this.reference) {
      this.reference = gray;
    } else {
      for (let i = 0; i < gray.length; i++) {
        this.reference[i] = this.reference[i] * 0.85 + gray[i] * 0.15;
      }
    }
  }

  // true jika ada benda yang cukup berbeda dari latar belakang kosong
  hasObject(cropCanvas) {
    if (!this.reference) return false;
    const gray = this._downsampleGray(cropCanvas);
    let diffSum = 0;
    for (let i = 0; i < gray.length; i++) {
      diffSum += Math.abs(gray[i] - this.reference[i]);
    }
    const meanDiff = diffSum / gray.length;
    return meanDiff > this.cfg.bgDiffThreshold;
  }
}

/* --------------------------------------------------------------------- *
 * Prediction Smoothing
 * (padanan dari class PredictionSmoother)
 * --------------------------------------------------------------------- */
class PredictionSmoother {
  constructor(bufferSize) {
    this.bufferSize = bufferSize;
    this.buffer = [];
  }

  reset() {
    this.buffer = [];
  }

  push(scores) {
    this.buffer.push(scores);
    if (this.buffer.length > this.bufferSize) this.buffer.shift();

    const n = this.buffer.length;
    // weights = linspace(1.0, 2.0, n), lalu dinormalisasi
    const weights = [];
    for (let i = 0; i < n; i++) {
      weights.push(n === 1 ? 1.0 : 1.0 + (i * 1.0) / (n - 1));
    }
    const wSum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++) weights[i] /= wSum;

    const numClasses = this.buffer[0].length;
    const avg = new Float32Array(numClasses);
    for (let i = 0; i < n; i++) {
      const scores_i = this.buffer[i];
      const w = weights[i];
      for (let c = 0; c < numClasses; c++) {
        avg[c] += scores_i[c] * w;
      }
    }
    return avg;
  }
}

/* --------------------------------------------------------------------- *
 * UI / Overlay Rendering
 * (padanan dari class Overlay)
 * --------------------------------------------------------------------- */
class Overlay {
  constructor(cfg) {
    this.cfg = cfg;
  }

  focusBox(w, h) {
    const mx = Math.max(1, Math.floor(w * this.cfg.marginRatioX));
    const my = Math.max(1, Math.floor(h * this.cfg.marginRatioY));
    const x1 = mx,
      y1 = my;
    const x2 = Math.max(x1 + 1, w - mx);
    const y2 = Math.max(y1 + 1, h - my);
    return [x1, y1, x2, y2];
  }

  categoryFor(label) {
    const lower = label.toLowerCase();
    if (lower.includes("anorganik")) {
      return [this.cfg.categoryColors.anorganik, "ANORGANIK"];
    } else if (lower.includes("organik")) {
      return [this.cfg.categoryColors.organik, "ORGANIK"];
    }
    return [this.cfg.defaultColor, label.toUpperCase()];
  }

  // sourceCanvas: frame kamera utuh sebagai <canvas>
  // ctx: konteks 2D dari canvas output yang berukuran sama
  render(ctx, sourceCanvas, label, confidence) {
    const w = sourceCanvas.width;
    const h = sourceCanvas.height;
    const [x1, y1, x2, y2] = this.focusBox(w, h);

    // 1) Gambar versi blur sebagai latar belakang
    ctx.save();
    ctx.filter = `blur(${this.cfg.blurPx}px)`;
    ctx.drawImage(sourceCanvas, 0, 0, w, h);
    ctx.restore();

    // 2) Tempel area fokus (tanpa blur) di atasnya
    const bw = x2 - x1,
      bh = y2 - y1;
    ctx.drawImage(sourceCanvas, x1, y1, bw, bh, x1, y1, bw, bh);

    let color, categoryName, infoText;
    if (label !== null) {
      [color, categoryName] = this.categoryFor(label);
      infoText = `Sampah: ${label} (${(confidence * 100).toFixed(1)}%)`;
    } else {
      color = this.cfg.idleColor;
      categoryName = null;
      infoText = "Posisikan Sampah di Dalam Kotak";
    }

    // 3) Kotak fokus
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, bw, bh);

    // 4) Teks info + banner kategori
    this._drawTextWithBg(ctx, infoText, 10, 40, color);
    this._drawCategoryBanner(ctx, w, h, categoryName, color);
  }

  _drawCategoryBanner(ctx, w, h, categoryName, color) {
    const bannerH = Math.max(50, Math.floor(h * 0.08));
    const y0 = h - bannerH;

    let text, textColor, bg;
    if (categoryName === null) {
      bg = "rgb(40,40,40)";
      text = "MENUNGGU SAMPAH...";
      textColor = "rgb(200,200,200)";
    } else {
      bg = color;
      text = categoryName;
      const [r, g, b] = this._parseRgb(color);
      const brightness = 0.114 * r + 0.587 * g + 0.299 * b;
      textColor = brightness > 180 ? "rgb(0,0,0)" : "rgb(255,255,255)";
    }

    ctx.fillStyle = bg;
    ctx.fillRect(0, y0, w, bannerH);

    ctx.font = "bold 28px Arial";
    ctx.textBaseline = "alphabetic";
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = 28;
    const tx = Math.max(10, (w - tw) / 2);
    const ty = y0 + (bannerH + th) / 2;
    ctx.fillStyle = textColor;
    ctx.fillText(text, tx, ty);
  }

  _drawTextWithBg(ctx, text, x, y, color) {
    ctx.font = "20px Arial";
    const metrics = ctx.measureText(text);
    const tw = metrics.width;
    const th = 20;
    const baseline = 6;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(x - 5, y - th - 8, tw + 10, th + baseline + 13);

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  _parseRgb(rgbStr) {
    const m = rgbStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [255, 255, 255];
  }
}

/* --------------------------------------------------------------------- *
 * Classification Helper
 * (padanan dari fungsi classify_frame)
 * --------------------------------------------------------------------- */
async function classifyFrame(classifier, smoother, cropCanvas, cfg) {
  const scores = await classifier.predict(cropCanvas);
  const avg = smoother.push(scores);

  let idx = 0;
  for (let i = 1; i < avg.length; i++) if (avg[i] > avg[idx]) idx = i;
  const confidence = avg[idx];
  const name = classifier.classNames[idx];

  if (confidence < cfg.confidenceThreshold) return [null, confidence];

  const cleanName = name.toLowerCase().trim();
  if (cfg.ignoreLabels.some((ignored) => cleanName.includes(ignored))) {
    return [null, confidence];
  }

  // Hanya terima label yang termasuk kategori yang diizinkan
  // (organik / anorganik). Selain itu dianggap tidak terdeteksi.
  const isAllowed = cfg.allowedCategories.some((cat) =>
    cleanName.includes(cat),
  );
  if (!isAllowed) {
    return [null, confidence];
  }

  return [name, confidence];
}

/* --------------------------------------------------------------------- *
 * Main Loop
 * Disesuaikan agar terhubung langsung dengan elemen-elemen yang ada
 * di projek-ML client side/page/scaner.html (menggantikan simulasi/mock
 * yang sebelumnya ada di file HTML tersebut).
 * --------------------------------------------------------------------- */
async function main(cfg) {
  // --- Elemen kamera & status (dari scaner.html) ---
  const video = document.getElementById("webcam-feed");
  const placeholderEl = document.getElementById("camera-placeholder");
  const outputCanvas = document.getElementById("output-canvas");
  const outCtx = outputCanvas.getContext("2d");

  const startBtn = document.getElementById("btn-toggle-cam");
  const startBtnLabel = document.getElementById("btn-cam-label");
  const recalibrateBtn = document.getElementById("btn-recalibrate");
  const statusDotEl = document.getElementById("cam-status-dot");
  const statusTextEl = document.getElementById("cam-status-text");

  // --- Elemen panel "Analysis Output" (dari scaner.html) ---
  const timestampEl = document.getElementById("detection-timestamp");
  const categoryBadgeEl = document.getElementById("category-badge");
  const confidenceScoreEl = document.getElementById("confidence-score");
  const detectedMaterialEl = document.getElementById("detected-material");
  const detectedDescEl = document.getElementById("detected-desc");
  const disposalInstructionsEl = document.getElementById(
    "disposal-instructions",
  );

  // Canvas tersembunyi untuk menampung frame mentah dan crop area fokus
  const frameCanvas = document.createElement("canvas");
  const frameCtx = frameCanvas.getContext("2d");
  const cropCanvas = document.createElement("canvas");
  const cropCtx = cropCanvas.getContext("2d");

  const classifier = new WasteClassifier(cfg);
  const smoother = new PredictionSmoother(cfg.bufferSize);
  const overlay = new Overlay(cfg);
  const bgGate = new BackgroundGate(cfg);

  function setStatus(text, colorClass) {
    statusTextEl.textContent = text;
    if (colorClass) {
      statusTextEl.className = `text-xs font-bold uppercase tracking-wider ${colorClass}`;
    }
  }

  function setStatusDot(colorClass) {
    statusDotEl.className = `w-3 h-3 rounded-full ${colorClass}`;
  }

  // Reset panel hasil ke kondisi "idle" (belum ada objek terdeteksi)
  function renderIdleResult() {
    categoryBadgeEl.textContent = "Awaiting Scan";
    categoryBadgeEl.className =
      "px-3 py-1 rounded-full bg-neutral-800 text-neutral-400 text-xs font-bold uppercase tracking-wider";
    confidenceScoreEl.textContent = "0% Confidence";
    detectedMaterialEl.textContent = "No Item Detected";
    detectedDescEl.textContent = "Posisikan sampah di dalam kotak fokus.";
    disposalInstructionsEl.textContent =
      "System standby. Place target material inside the reticle frame.";
  }

  // Update panel hasil setiap kali ada label baru dari classifyFrame
  function renderResult(label, confidence) {
    const now = new Date();
    timestampEl.textContent = now.toLocaleTimeString();

    if (label === null) {
      renderIdleResult();
      return;
    }

    const lower = label.toLowerCase();
    const info = lower.includes("anorganik")
      ? cfg.categoryInfo.anorganik
      : lower.includes("organik")
        ? cfg.categoryInfo.organik
        : null;

    categoryBadgeEl.textContent = info ? info.badge : label.toUpperCase();
    categoryBadgeEl.className = `px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
      info ? info.badgeColor : "bg-neutral-800 text-neutral-400"
    }`;
    confidenceScoreEl.textContent = `${(confidence * 100).toFixed(1)}% Confidence`;
    detectedMaterialEl.textContent = label;
    detectedDescEl.textContent = info
      ? info.desc
      : "Objek terdeteksi di luar kategori yang dikenali.";
    disposalInstructionsEl.textContent = info
      ? info.instructions
      : "Periksa manual untuk kategori pembuangan yang sesuai.";
  }

  setStatus("Memuat model...", "text-amber-400");
  startBtn.disabled = true;
  await classifier.load();

  startBtn.disabled = false;
  setStatus("Camera Standby", "text-amber-400");
  setStatusDot("bg-amber-400");

  function grabCrop(w, h) {
    const [x1, y1, x2, y2] = overlay.focusBox(w, h);
    cropCanvas.width = x2 - x1;
    cropCanvas.height = y2 - y1;
    cropCtx.drawImage(
      frameCanvas,
      x1,
      y1,
      x2 - x1,
      y2 - y1,
      0,
      0,
      x2 - x1,
      y2 - y1,
    );
    return cropCanvas;
  }

  async function runCalibration(w, h) {
    setStatus("Kalibrasi latar... kosongkan kotak fokus", "text-amber-400");
    bgGate.reset();
    for (let i = 0; i < cfg.calibrationFrames; i++) {
      frameCtx.drawImage(video, 0, 0, w, h);
      const crop = grabCrop(w, h);
      if (crop.width > 0 && crop.height > 0) bgGate.calibrate(crop);
      // beri jeda antar frame kalibrasi
      await new Promise((r) => setTimeout(r, 30));
    }
    smoother.reset();
    setStatus("Camera Live Feed", "text-emerald-400");
    setStatusDot("bg-emerald-400 animate-pulse");
    recalibrateBtn.style.display = "inline-flex";
  }

  let stream = null;
  let cameraActive = false;
  let loopHandle = null;
  let busy = false;
  let lastLabel = null;
  let lastConfidence = 0;

  async function loop(w, h) {
    frameCtx.drawImage(video, 0, 0, w, h);

    if (!busy) {
      busy = true;
      const crop = grabCrop(w, h);

      if (crop.width > 0 && crop.height > 0) {
        if (bgGate.hasObject(crop)) {
          classifyFrame(classifier, smoother, crop, cfg)
            .then(([label, confidence]) => {
              if (label !== lastLabel) renderResult(label, confidence);
              lastLabel = label;
              lastConfidence = confidence;
            })
            .finally(() => {
              busy = false;
            });
        } else {
          // Kotak kosong / hanya latar ruangan -> jangan klasifikasikan
          smoother.reset();
          if (lastLabel !== null) renderResult(null, 0);
          lastLabel = null;
          lastConfidence = 0;
          busy = false;
        }
      } else {
        busy = false;
      }
    }

    overlay.render(outCtx, frameCanvas, lastLabel, lastConfidence);
    loopHandle = requestAnimationFrame(() => loop(w, h));
  }

  async function startCamera() {
    startBtn.disabled = true;
    setStatus("Meminta izin kamera...", "text-amber-400");
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: cfg.frameWidth },
          height: { ideal: cfg.frameHeight },
          facingMode: "environment",
        },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
    } catch (err) {
      setStatus("Gagal mengakses kamera: " + err.message, "text-rose-400");
      startBtn.disabled = false;
      return;
    }

    const w = video.videoWidth || cfg.frameWidth;
    const h = video.videoHeight || cfg.frameHeight;
    frameCanvas.width = w;
    frameCanvas.height = h;
    outputCanvas.width = w;
    outputCanvas.height = h;

    placeholderEl.classList.add("hidden");
    outputCanvas.classList.remove("hidden");
    startBtnLabel.textContent = "Stop Camera";
    startBtn.disabled = false;
    cameraActive = true;

    await runCalibration(w, h);
    loop(w, h);
  }

  function stopCamera() {
    if (loopHandle) cancelAnimationFrame(loopHandle);
    loopHandle = null;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    cameraActive = false;
    lastLabel = null;
    lastConfidence = 0;
    smoother.reset();
    bgGate.reset();

    outputCanvas.classList.add("hidden");
    placeholderEl.classList.remove("hidden");
    recalibrateBtn.style.display = "none";
    startBtnLabel.textContent = "Start Camera";
    setStatus("Camera Standby", "text-amber-400");
    setStatusDot("bg-amber-400");
    renderIdleResult();
    timestampEl.textContent = "--:--:--";
  }

  startBtn.addEventListener("click", () => {
    if (cameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  });

  recalibrateBtn.addEventListener("click", () => {
    if (!cameraActive) return;
    const w = video.videoWidth || cfg.frameWidth;
    const h = video.videoHeight || cfg.frameHeight;
    runCalibration(w, h);
  });
}

main(Config).catch((err) => {
  const statusTextEl = document.getElementById("cam-status-text");
  if (statusTextEl) statusTextEl.textContent = "Error: " + err.message;
  console.error(err);
});
