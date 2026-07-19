const { Client, GatewayIntentBits, Partials, Collection, REST, Routes } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000; 

app.get('/', (req, res) => res.send('Zen Bot 7/24 Aktif!'));
app.listen(PORT, () => console.log(`[Web] Web sunucusu ${PORT} portunda açıldı.`));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers 
    ],
    // DM'leri ve eksik verileri okuyabilmek için Partials eklendi
    partials: [
        Partials.Channel, 
        Partials.Message, 
        Partials.GuildMember
    ]
});

client.commands = new Collection();
const commands = [];
const commandsPath = path.join(__dirname, 'commands');

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
    } else {
        console.warn(`[Uyarı] ${file} dosyasında 'data' veya 'execute' özelliği eksik!`);
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
        console.log(`[Bot] ${commands.length} komut başarıyla kaydedildi!`);
    } catch (error) {
        console.error('[Hata] Komut kaydında sorun çıktı:', error);
    }
});

// Etkileşim Dinleyicisi
client.on('interactionCreate', async interaction => {
    
    // ── 🛡️ VERIFY BUTON KODU ──
    if (interaction.isButton() && interaction.customId === 'forces_verify_btn') {
        const VERILECEK_ROL_ID = '1527008029877207050'; 
        
        // Cache'de yoksa diye sunucuyu fetchlemek daha güvenlidir
        const role = interaction.guild?.roles.cache.get(VERILECEK_ROL_ID);
        if (!role) {
            return await interaction.reply({ 
                content: '❌ Doğrulama rolü sunucuda bulunamadı. Lütfen yöneticiye bildirin.', 
                ephemeral: true // flags: 64 yerine güncel kullanım
            }).catch(() => {});
        }

        // Kullanıcının zaten rolü var mı kontrolü
        if (interaction.member.roles.cache.has(VERILECEK_ROL_ID)) {
            return await interaction.reply({ 
                content: '✅ Zaten doğrulanmışsın!', 
                ephemeral: true 
            }).catch(() => {});
        }

        try {
            await interaction.member.roles.add(role);
            return await interaction.reply({ 
                content: '✅ Başarıyla doğrulandınız! Sunucu kanalları sizin için açıldı.', 
                ephemeral: true 
            }).catch(() => {});
        } catch (error) {
            console.error('[Verify Rol Verme Hatası]:', error);
            return await interaction.reply({ 
                content: '❌ Rol verilemedi. Botun rolünü sunucu ayarlarından üste taşıyın.', 
                ephemeral: true 
            }).catch(() => {});
        }
    }

    // ── 🚀 SLASH KOMUT TETİKLEYİCİSİ ──
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[Komut Hatası] ${interaction.commandName} çalışırken patladı:`, error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ Bu komut çalıştırılırken bir hata oluştu!', 
                    ephemeral: true 
                }).catch(() => {});
            } else if (interaction.deferred) {
                await interaction.editReply({ 
                    content: '❌ Bu komut çalıştırılırken bir hata oluştu!' 
                }).catch(() => {});
            }
        }
    }
});

// ── 🛡️ ANTI-CRASH (HATA YAKALAMA) SİSTEMİ ──
// Bu kısım, botun beklenmedik hatalarda çökmesini ve kapanmasını engeller.
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Anti-Crash] İşlenmeyen Promise Hatası:', promise, 'Sebep:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('[Anti-Crash] Beklenmeyen Hata:', error);
});

// ── 🔑 DISCORD BAĞLANTI KONTROLÜ ──
if (!process.env.TOKEN) {
    console.error("[Kritik Hata] Render üzerinde veya .env dosyasında TOKEN bulunamadı!");
} else {
    console.log("[Bot] Discord API'sine bağlanılmaya çalışılıyor...");
    client.login(process.env.TOKEN).catch(err => {
        console.error("[Giriş Hatası] Bot Discord'a bağlanırken patladı! Sebep:", err.message);
    });
}
