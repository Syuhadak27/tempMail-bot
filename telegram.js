import { BOT_TOKEN } from "./config.js";

const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function handleSaveCommand(chatId, env, userName) {
    try {
        // Ambil daftar email user
        const userKey = `user:${chatId}`;
        const userEmails = JSON.parse(await env.EMAIL.get(userKey) || "[]");

        // Jika user tidak punya email, kirim pesan lalu hentikan eksekusi
        if (userEmails.length === 0) {
            await sendMessage(chatId, "📭 Tidak ada email yang tersimpan untuk Anda. Buat email terlebih dahulu dengan perintah /buat_email.");
            return new Response("User tidak memiliki email, tidak ada backup yang dibuat.", { status: 200 });
        }

        // Buat format tanggal sekarang
        const now = new Date();
        const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
        const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
        const timestamp = `${formattedDate}_${formattedTime}`;

        let backupData = `📁 Backup Data Email\n\n`;
        for (const email of userEmails) {
            const token = await env.EMAIL.get(email) || "Tidak ditemukan";
            backupData += `📧 Email: ${email}\n🔑 Token: ${token}\n\n`;
        }

        // Buat nama file dengan timestamp
        const fileName = `backup_${userName}_${timestamp}.txt`;

        // Buat file teks dari string
        const fileContent = new Blob([backupData], { type: "text/plain" });
        const file = new File([fileContent], fileName);

        // Kirim file ke Telegram
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("document", file);

        const res = await fetch(`${API_URL}/sendDocument`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (!data.ok) throw new Error("Gagal mengirim file ke Telegram.");

        return new Response("Backup berhasil dikirim!", { status: 200 });
    } catch (error) {
        console.error("Error di handleSaveCommand:", error);
        return sendMessage(chatId, "❌ Gagal membuat backup: " + error.message);
    }
}

export async function sendMessage(chatId, text) {
    try {
        await fetch(`${API_URL}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: "HTML" }),
        });
    } catch (error) {
        console.error("Gagal mengirim pesan:", error);
    }
}