import {BOT_TOKEN, WEBHOOK_URL} from "./config.js";
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;


export default {
	async fetch(request) {
	  const url = new URL(request.url);
  
	  // Tangani Webhook dari Telegram
	  if (request.method === "POST" && url.pathname === "/webhook") {
		const body = await request.json();
		console.log("Update dari Telegram:", body);
		return handleTelegramUpdate(body);
	  }
  
	  // Endpoint untuk setup webhook
	  if (url.pathname === "/setWebhook") {
		return setWebhook();
	  }
  
	  return new Response("✅ Bot Telegram Worker Aktif!", { status: 200 });
	},
  };
  
  
  
  
  // Tangani update dari Telegram
  async function handleTelegramUpdate(update) {
	if (!update.message) return new Response("⚠ Tidak ada pesan", { status: 200 });
  
	const chatId = update.message.chat.id;
	const text = update.message.text || "";
  
	if (text === "/start") {
	  return sendMessage(
		chatId,
		"👋 Selamat datang di Bot Email Temporary!\n\nGunakan perintah berikut:\n📧 `/buat_email` → Buat email sementara\n\nSilakan coba!"
	  );
	} else if (text.startsWith("/buat_email")) {
	   const userName = update.message.from.username || update.message.from.first_name || `SetUsername_${chatId}`;
	   return buatEmail(chatId, userName);
	} else if (text.startsWith("/cek_email ")) {
	  const token = text.split(" ")[1];
	  return cekInbox(chatId, token);
	} else {
	  //return sendMessage(chatId, "❌ Perintah tidak dikenali.");
	  return new Response("OK", { status: 200 });
	}
  }
  
  // Fungsi untuk membuat email dengan mail.tm
  async function buatEmail(chatId, userName) {
	try {
	  const domainRes = await fetch("https://api.mail.tm/domains");
	  const domainData = await domainRes.json();
	  const domain = domainData["hydra:member"][0]?.domain || "mail.tm";
  
	  // Gunakan username pengguna jika ada, jika tidak, gunakan chatId
	  const username = userName ? userName.replace(/[^a-zA-Z0-9]/g, '') : `user${chatId}`;
	  const email = `${username}${Date.now()}@${domain}`;
	  const password = "Rahasia123";
  
	  // Buat akun email
	  const createAccount = await fetch("https://api.mail.tm/accounts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ address: email, password: password }),
	  });
  
	  if (!createAccount.ok) throw new Error("Gagal membuat akun email.");
  
	  // Ambil token login
	  const tokenRes = await fetch("https://api.mail.tm/token", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ address: email, password: password }),
	  });
  
	  const tokenData = await tokenRes.json();
	  if (!tokenData.token) throw new Error("Gagal mendapatkan token.");
	  const responseText = `✅ Email berhasil dibuat:\n📧 Email: ${email}\n\nGunakan perintah berikut untuk mengecek pesan:\n📩 \`/cek_email ${tokenData.token}\``;
	   
  
	  return sendMessage(chatId, responseText);
	} catch (error) {
	  return sendMessage(chatId, "❌ Gagal membuat email: " + error.message);
	}
  }
  
  
  // Fungsi untuk mengecek pesan masuk
  async function cekInbox(chatId, token) {
	try {
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
	await fetch(`${API_URL}/sendMessage`, {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" }),
	});
  
	return new Response("OK", { status: 200 });
  }
  
  // Fungsi untuk mengatur webhook bot
  async function setWebhook() {
	const res = await fetch(`${API_URL}/setWebhook`, {
	  method: "POST",
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify({ url: WEBHOOK_URL}),
	});
  
	return new Response(await res.text(), { status: res.status });
  }
  
