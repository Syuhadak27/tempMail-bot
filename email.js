import { BOT_TOKEN, WEBHOOK_URL } from "./config.js"; 
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;


export async function buatEmail(chatId, userName, env) {
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
export async function cekInbox(chatId, email, env) {
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

export async function listEmails(chatId, env) {
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
export async function hapusEmail(chatId, email, env) {
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

const hari = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
function getRandomHari() {
  return hari[Math.floor(Math.random() * hari.length)];
}


export async function sendMessage(chatId, text) {
  const res = await fetch(`${API_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "HTML" }),
  });

  const data = await res.json();
  console.log("Respon dari Telegram:", data); // Tambahkan log ini

  return new Response("OK", { status: 200 });
}