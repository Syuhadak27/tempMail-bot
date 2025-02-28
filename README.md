
# 🚀 Bot Telegram - Email Temporary  
Bot ini memungkinkan Anda untuk membuat **email sementara**, membaca inbox, dan mengelola email langsung melalui **Telegram** menggunakan API dari **mail.tm**.  

## 📌 Fitur  
✅ **Buat email sementara**  
✅ **Cek pesan masuk**  
✅ **Lihat daftar email yang dibuat**  
✅ **Hapus email**  
✅ **Ambil token email**  
✅ **Akses inbox langsung dengan token**  

---

## ⚙️ Persyaratan  
Sebelum menjalankan bot ini, pastikan Anda memiliki:  

- ✅ **Cloudflare Workers** (untuk menjalankan kode bot)  
- ✅ **Bot Telegram** dengan **BOT_TOKEN**  
- ✅ **Webhook aktif** untuk menerima perintah dari Telegram  
- ✅ **Akses ke API mail.tm**  

---

## 🚀 Cara Instalasi  

### 1️⃣ **Clone Repository**  
```sh
git clone https://github.com/Syuhadak27/tempMail-bot.git
```
rename <code>config-SAMPLE.js</code> ke <code>config.js</code>

Pindahkan file <code>index.js , email.js , config.js</code> ke folder project/src

2️⃣ Buat Bot Telegram & Dapatkan Token

1. Buka @BotFather di Telegram


2. Gunakan perintah /newbot dan ikuti instruksi


3. Simpan BOT_TOKEN yang diberikan oleh BotFather



3️⃣ Konfigurasi

Buat file config.js dan tambahkan variabel berikut:

```sh
export const BOT_TOKEN = "your-telegram-bot-token";
export const WEBHOOK_URL = "https://your-cloudflare-worker-url/webhook";
```

4️⃣ Deploy ke Cloudflare Workers

```sh
wrangler init temp-mail
```
Pilih javascript - worker Hello word

Edit wrangler.jsonc atau wrangler.json untuk menyesuaikan pengaturan Cloudflare:

```sh
{
	"name": "temp-mail",
	"main": "src/index.js",
	"compatibility_date": "2025-02-27",
	"observability": {
		"enabled": true,
	},
	"kv_namespaces": [
    {
      "binding": "EMAIL",
      "id": "ID DARI KV NAMESPACE"
    }
  ]
}

```
Jalankan perintah:

```sh
wrangler deploy
```

5️⃣ Set Webhook

Jalankan perintah ini untuk menghubungkan bot dengan Cloudflare Workers:
**Via Terminal**
```sh
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>/webhook"
```
**Via Web browser**
```sh
https://your-worker-web.dev/setWebhook
```
---

## 📜 Perintah Bot  

Berikut daftar perintah yang bisa digunakan:  

| Perintah          | Fungsi                                         |
|------------------|----------------------------------------------|
| `/start`        | Memulai bot dan melihat daftar perintah       |
| `/buat_email`   | Membuat email sementara baru                 |
| `/baca_email <email>` | Cek pesan masuk dari email            |
| `/list`         | Melihat daftar email yang dibuat             |
| `/hapus <email>` | Menghapus email dari database               |
| `/token <email>` | Menampilkan token autentikasi untuk email   |
| `/get <token>`  | Mengambil inbox berdasarkan token            |


---

🎯 Contoh Penggunaan

1️⃣ Membuat email baru:

/buat_email

Bot akan membalas:

✅ Email berhasil dibuat:  
📧 Email: <code>nama-random@mail.tm</code>  
Gunakan perintah:  
📩 /baca_email nama-random@mail.tm

2️⃣ Membaca pesan masuk:

/baca_email nama-random@mail.tm

Bot akan membalas jika ada pesan:

📩 Pesan Baru di Email:  
📝 Dari: example@mail.com  
📌 Subjek: Selamat datang!  
📜 Isi: Ini adalah email uji coba.

3️⃣ Menghapus email:

/hapus nama-random@mail.tm

Bot akan membalas:

✅ Email nama-random@mail.tm berhasil dihapus.

4️⃣ Mendapatkan token email:

/token nama-random@mail.tm

Bot akan membalas:

🔑 Token untuk email nama-random@mail.tm:  
<code>abcdefgh123456789</code>

5️⃣ Menggunakan token untuk membaca inbox:

/get abcdefgh123456789

Bot akan membalas dengan pesan terbaru dari inbox.


---

🎯 Lisensi

📝 MIT License – Gunakan dan modifikasi bebas.


---

🚀 Mulai gunakan bot ini sekarang dan kelola email sementara langsung dari Telegram!

---
👤Owner
[Telegram](https://t.me/hidestream_bot)

