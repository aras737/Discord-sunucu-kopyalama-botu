const { Client } = require('discord.js-selfbot-v13');
const http = require('http');
require('dotenv').config();

// 1. Gelişmiş İstemci Yapılandırması
const client = new Client({
    checkUpdate: false,
    patchVoice: true, // Ses kanallarına destek (isteğe bağlı)
});

// 2. Render Ayakta Tutma (Keep-Alive) ve Port Bağlama
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        status: 'online',
        uptime: process.uptime(),
        bot_user: client.user ? client.user.tag : 'Bağlanıyor...'
    }));
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`[SİSTEM] Sunucu ${PORT} portunda aktif.`);
});

// 3. Gelişmiş Hata Yönetimi (Botun Çökmesini Engeller)
process.on('unhandledRejection', (reason, promise) => {
    console.error('[HATA] Yakalanmayan Reddetme:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('[KRİTİK HATA] Uygulama Çökmesi Önlemek İçin Yakalandı:', err);
});

// 4. Bot Hazır Olduğunda
client.on('ready', async () => {
    console.log('--------------------------------------');
    console.log(`[BOT] Giriş Başarılı: ${client.user.tag}`);
    console.log(`[BİLGİ] ${client.guilds.cache.size} adet sunucuda aktif.`);
    console.log('--------------------------------------');
});

// 5. Basit Kopyalama Komutu Taslağı (Örnek Mantık)
client.on('messageCreate', async (message) => {
    // Sadece siz yazdığınızda çalışır
    if (message.author.id !== client.user.id) return;

    if (message.content.startsWith('!kopyala')) {
        const args = message.content.split(' ');
        const hedefID = args[1]; // Kopyalanacak sunucu ID

        if (!hedefID) return message.reply('Lütfen bir sunucu ID belirtin! Örn: !kopyala 123456789');

        try {
            const guild = client.guilds.cache.get(hedefID);
            if (!guild) return message.reply('Sunucu bulunamadı!');

            console.log(`[İŞLEM] ${guild.name} sunucusu kopyalanıyor...`);
            // Kopyalama fonksiyonlarını buraya ekleyebilirsin
            message.reply(`✅ **${guild.name}** kopyalama işlemi başlatıldı.`);
        } catch (err) {
            console.error('[HATA] Kopyalama sırasında hata:', err);
        }
    }
});

// 6. Güvenli Giriş Sistemi
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error("[HATA] Ortam değişkeni 'TOKEN' bulunamadı!");
    process.exit(1);
}

// Render'da bazen internet geç gelir, 2 saniye bekleyip giriş yapıyoruz
setTimeout(() => {
    client.login(TOKEN).catch(err => {
        console.error("[GİRİŞ HATASI] Token geçersiz veya Discord IP engelledi!");
        console.error(err.message);
    });
}, 2000);
