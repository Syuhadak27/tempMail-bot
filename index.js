import { BOT_TOKEN, WEBHOOK_URL } from "./config.js"; // EMAIL adalah namespace KV
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Tangani webhook dari Telegram
    if (request.method === "POST" && url.pathname === "/webhook") {
      const body = await request.json();
      console.log("Update dari Telegram:", body);
      return handleTelegramUpdate(body, env);
    }

    // Endpoint untuk setup webhook
    if (url.pathname === "/setWebhook") {
      return setWebhook();
    }

    return new Response("✅ Bot Telegram Worker Aktif!", { status: 200 });
  },
};

async function handleTelegramUpdate(update, env) {
  if (!update.message) {
    return sendMessage(update.message.chat.id, "⚠ Tidak ada pesan yang bisa diproses.");
  }

  const chatId = update.message.chat.id;
  const text = update.message.text || "";

  if (text === "/start") {
    return sendMessage(
      chatId,
      "👋 Selamat datang di Bot Email Temporary!\n\nGunakan perintah berikut:\n" +
      "📧 /buat_email → Buat email sementara\n" +
      "📩 /baca_email emailmu → Cek pesan masuk\n" +
      "📜 /list → Lihat daftar email\n" +
      "❌ /hapus emailmu → Hapus email yang sudah dibuat\n\nSilakan coba!"
    );
  }

  if (text.startsWith("/buat_email")) {
    const userName = update.message.from.username || update.message.from.first_name || `SetUsername_${chatId}`;
    return buatEmail(chatId, userName, env);
  }

  if (text.startsWith("/baca_email ")) {
    const email = text.split(" ")[1];
    return cekInbox(chatId, email, env);
  }

  if (text === "/list") {
    return listEmails(chatId, env);
  }

  if (text.startsWith("/hapus ")) {
    const email = text.split(" ")[1];
    return hapusEmail(chatId, email, env);
  }

   return new Response('OK', { status: 200 });
  //return sendMessage(chatId, "❓ Perintah tidak dikenal. Gunakan /start untuk melihat daftar perintah.");
}
async function buatEmail(chatId, userName, env) {
    try {
        const domainRes = await fetch("https://api.mail.tm/domains");
        const domainData = await domainRes.json();
        const domain = domainData["hydra:member"][0]?.domain || "mail.tm";

        const namaHari = getRandomHari();
        const email = `${namaHari}${Date.now()}@${domain}`;
        const password = "Rahasia123";

        const createAccount = await fetch("https://api.mail.tm/accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: email, password: password }),
        });

        if (!createAccount.ok) throw new Error("Gagal membuat akun email.");

        const tokenRes = await fetch("https://api.mail.tm/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: email, password: password }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.token) throw new Error("Gagal mendapatkan token.");

        await env.EMAIL.put(email, tokenData.token);

        // Simpan email ke daftar pengguna
        const userKey = `user:${chatId}`;
        let userEmails = JSON.parse(await env.EMAIL.get(userKey) || "[]");
        userEmails.push(email);
        await env.EMAIL.put(userKey, JSON.stringify(userEmails));

        return sendMessage(chatId, `✅ Email berhasil dibuat:\n📧 Email: <code>${email}</code>\nGunakan perintah:\n📩 <code>/baca_email ${email}</code>`);
    } catch (error) {
        return sendMessage(chatId, "❌ Gagal membuat email: " + error.message);
    }
}

// Fungsi untuk mengecek pesan masuk berdasarkan email
async function cekInbox(chatId, email, env) {
  try {
    const token = await env.EMAIL.get(email); // Ambil token dari KV

    if (!token) {
      return sendMessage(chatId, "❌ Email tidak ditemukan atau belum dibuat dengan bot ini.");
    }

    const inboxRes = await fetch("https://api.mail.tm/messages", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const inboxData = await inboxRes.json();
    if (inboxData["hydra:member"].length === 0) {
      return sendMessage(chatId, "📭 Tidak ada pesan baru di email.");
    }

    const latestMsg = inboxData["hydra:member"][0]; // Ambil pesan terbaru
    const msgDetailRes = await fetch(`https://api.mail.tm/messages/${latestMsg.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const msgDetail = await msgDetailRes.json();
    const responseText = `📩 Pesan Baru di Email:\n📝 Dari: ${msgDetail.from.address}\n📌 Subjek: ${msgDetail.subject}\n📜 Isi:\n${msgDetail.text}`;

    return sendMessage(chatId, responseText);
  } catch (error) {
    return sendMessage(chatId, "❌ Gagal mengambil inbox: " + error.message);
  }
}

// Fungsi untuk mengirim pesan ke Telegram
async function sendMessage(chatId, text) {
  const res = await fetch(`${API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "HTML" }),
  });

  const data = await res.json();
  console.log("Respon dari Telegram:", data); // Tambahkan log ini

  return new Response("OK", { status: 200 });
}

// Fungsi untuk mengatur webhook bot
async function setWebhook() {
  const res = await fetch(`${API_URL}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: WEBHOOK_URL }),
  });

  return new Response(await res.text(), { status: res.status });
}


const hari = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
function getRandomHari() {
  return hari[Math.floor(Math.random() * hari.length)];
}


// Fungsi untuk menampilkan daftar email pengguna
async function listEmails(chatId, env) {
    const userKey = `user:${chatId}`;
    const userEmails = JSON.parse(await env.EMAIL.get(userKey) || "[]");

    if (userEmails.length === 0) {
        return sendMessage(chatId, "📭 Tidak ada email yang tersimpan untuk Anda.");
    }

    let emailList = "📧 Daftar Email Anda:\n";
    for (const email of userEmails) {
        emailList += `📌 <code>${email}</code>\n`;
    }

    return sendMessage(chatId, emailList);
}
// Fungsi untuk menghapus email berdasarkan chatId dan email
async function hapusEmail(chatId, email, env) {
    const userKey = `user:${chatId}`;
    let userEmails = JSON.parse(await env.EMAIL.get(userKey) || "[]");

    if (!userEmails.includes(email)) {
        return sendMessage(chatId, "❌ Email tidak ditemukan atau belum dibuat dengan bot ini.");
    }

    // Hapus token email dari KV
    await env.EMAIL.delete(email);

    // Hapus email dari daftar pengguna
    userEmails = userEmails.filter(e => e !== email);
    
    if (userEmails.length === 0) {
        // Jika tidak ada email tersisa, hapus kunci dari KV
        await env.EMAIL.delete(userKey);
    } else {
        // Jika masih ada email, perbarui daftar di KV
        await env.EMAIL.put(userKey, JSON.stringify(userEmails));
    }

    await sendMessage(chatId, `✅ Email ${email} berhasil dihapus.`);

    return listEmails(chatId, env); // Tampilkan daftar terbaru
}