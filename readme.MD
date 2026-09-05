# Binova - Smart Waste Recognition

## Menjalankan project

```bash
npm install
npm start
```

Lalu buka `http://127.0.0.1:8000/` di browser.

`npm start` menjalankan `start.js`, yaitu wrapper kecil di atas `http-server`
yang menampilkan output console yang rapi (tanpa noise warning npm / detail
konfigurasi bawaan http-server).

Kalau mau pakai `http-server` langsung tanpa wrapper:

```bash
cd public
npx http-server -p 8000
```

## Struktur folder

```
project-ML-test/
├── package.json
├── package-lock.json
├── README.md
└── public/              <- jalankan http-server dari sini
    ├── index.html       (landing page)
    ├── scaner.html      (halaman kamera & deteksi AI)
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── main.js      (animasi landing page)
    │   └── script.js    (logic kamera + model ML)
    ├── img/             (gambar/asset landing page)
    └── model/           (model TensorFlow.js hasil Teachable Machine)
        ├── model.json
        ├── metadata.json
        └── weights.bin
```
