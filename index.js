const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
// Render sunucuları için portu 10000 standardına sabitliyoruz
const PORT = process.env.PORT || 10000; 

app.get('/', (req, res) => res.send('Zen Bot 7/24 Aktif!'));
app.listen(PORT, () => console.log(`[Web] Web sunucusu ${PORT} portunda açıldı.`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers // Üyelere rol verebilmek için bu intent şarttır kanka
    ]
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Klasör yoksa otomatik oluştur ki hata vermesin
if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
}

client.once('ready', async () => {
    console.log(`[Bot] ${client.user.tag} başarıyla Discord'a bağlandı!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('[Bot] Slash komutları Discord\'a gönderiliyor...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('[Bot] Tüm komutlar başarıyla kaydedildi!');
    } catch (error) {
        console.error('[Hata] Komut kaydında sorun çıktı:', error);
    }
});

// Etkileşim Dinleyicisi (Komutlar ve Butonlar)
client.on('interactionCreate', async interaction => {
    
    // ── 🛡️ VERIFY BUTON KODU BAŞLANGICI ──
    if (interaction.isButton() && interaction.customId === 'forces_verify_btn') {
        // BURAYA SUNUCUNDAKİ DOĞRULANMIŞ ROLÜN ID'SİNİ YAPIŞTIR KANKA:
        const VERILECEK_ROL_ID = '123456789012345678'; 
        
        const role = interaction.guild?.roles.cache.get(VERILECEK_ROL_ID);
        if (!role) {
            return await interaction.reply({ 
                content: '❌ Doğrulama rolü sunucuda bulunamadı. Lütfen yöneticiye bildirin.', 
                flags: 64 // Ephemeral (Gizli mesaj)
            }).catch(() => {});
        }

        try {
            await interaction.member.roles.add(role);
            return await interaction.reply({ 
                content: '✅ Başarıyla doğrulandınız! Sunucu kanalları sizin için açıldı.', 
                flags: 64 
            }).catch(() => {});
        } catch (error) {
            console.error('[Verify Rol Verme Hatası]:', error);
            return await interaction.reply({ 
                content: '❌ Rol verilemedi. Botun rolünü sunucu ayarlarından üste taşıyın.', 
                flags: 64 
            }).catch(() => {});
        }
    }
    // ── 🛡️ VERIFY BUTON KODU BİTİŞI ──


    // ── 🚀 SLASH KOMUT TETİKLEYİCİSİ ──
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`[Komut Hatası] ${interaction.commandName} çalışırken patladı:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: 'Bu komut çalıştırılırken bir hata oluştu!', 
                    flags: 64 
                }).catch(() => {});
            }
        }
    }
});

// ── 🔑 DISCORD BAĞLANTI VE HATA KONTROLÜ ──
if (!process.env.TOKEN) {
    console.error("[Kritik Hata] Render üzerinde veya .env dosyasında TOKEN bulunamadı!");
} else {
    console.log("[Bot] Discord API'sine bağlanılmaya çalışılıyor...");
    client.login(process.env.TOKEN).catch(err => {
        console.error("[Giriş Hatası] Bot Discord'a bağlanırken patladı! Sebep:", err.message);
    });
}
