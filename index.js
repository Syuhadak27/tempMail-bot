import { BOT_TOKEN, WEBHOOK_URL } from "./config.js"; 
import { buatEmail, cekInbox, listEmails, hapusEmail, sendMessage, getToken, cekInboxDariToken } from "./email.js";
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
      "📩 /baca_email (emailmu) → Cek pesan masuk\n" +
      "📜 /list → Lihat daftar email\n" +
      "❌ /hapus (emailmu) → Hapus email yang sudah dibuat\n" +
      "💥 /token (emailmu) → Untuk melihat token dari emailmu \n" +
      "✈️ /get (emailmu) → untuk melihat inbox dg token\n\n Silakan coba!"
    );
  }

  if (text.startsWith("/buat_email")) {
    const userName = update.message.from.username || update.message.from.first_name || `SetUsername_${chatId}`;
    return buatEmail(chatId, userName, env);
  }
  if (text.startsWith("/token")) {
    const args = text.split(" ");
    
    if (args.length < 2) {
        return sendMessage(chatId, "⚠ Harap masukkan email yang ingin dilihat tokennya. Contoh: `/token email@example.com`", true);
    }

    const email = args[1];
    return getToken(chatId, email, env);
  }
  
  if (text.startsWith("/get")) {
    const args = text.split(" ");

    if (args.length < 2) {
        return sendMessage(chatId, "⚠ Harap masukkan token yang ingin digunakan. Contoh: `/get (token)`", true);
    }

    const token = args[1];
    return cekInboxDariToken(chatId, token);
  }

  //if (text.startsWith("/baca_email ")) {
    //const email = text.split(" ")[1];
    //return cekInbox(chatId, email, env);
  //}
  if (text.startsWith("/baca_email")) {
    const args = text.split(" ");

    if (args.length < 2) {
        return sendMessage(chatId, "⚠ Harap masukkan email yang ingin dibaca. Contoh: `/baca_email email@example.com`", true);
    }

    const email = args[1];
    return cekInbox(chatId, email, env);
  }

  if (text === "/list") {
    return listEmails(chatId, env);
  }

  //if (text.startsWith("/hapus ")) {
    //const email = text.split(" ")[1];
    //return hapusEmail(chatId, email, env);
  //}
  if (text.startsWith("/hapus")) {
    const args = text.split(" ");
    
    if (args.length < 2) {
        return sendMessage(chatId, "⚠ Harap masukkan email yang ingin dihapus. Contoh: `/hapus email@example.com`", true);
    }

    const email = args[1];
    return hapusEmail(chatId, email, env);
  }

   return new Response('OK', { status: 200 });
  //return sendMessage(chatId, "❓ Perintah tidak dikenal. Gunakan /start untuk melihat daftar perintah.");
}


// Fungsi untuk mengirim pesan ke Telegram


// Fungsi untuk mengatur webhook bot
async function setWebhook() {
  const res = await fetch(`${API_URL}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: WEBHOOK_URL }),
  });

  return new Response(await res.text(), { status: res.status });
}
