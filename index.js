require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, REST, Routes, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios'); // <-- GERÇEK İŞLEMİ BU YAPIYOR

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

client.commands = new Collection();
client.slashCommands = [];

// 1. KOMUTLARI YÜKLE
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if (command.name) client.commands.set(command.name, command);
        if (command.data && command.data.name) {
            client.commands.set(command.data.name, command);
            client.slashCommands.push(command.data.toJSON());
        }
    }
}

// 2. HAZIR OLMA VE SLASH KAYDI
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Gerçek Modda Aktif!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: client.slashCommands });
    } catch (error) { console.error(error); }
});

// 3. ETKİLEŞİM YÖNETİMİ
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    // --- BURASI GERÇEK BYPASS'IN ÇALIŞTIĞI YER ---
    if (interaction.isModalSubmit() && interaction.customId === 'bypassModal') {
        const url = interaction.fields.getTextInputValue('urlInput');
        
        // Kullanıcıya "Bekle, linki çözüyorum" diyoruz
        await interaction.deferReply({ ephemeral: false });

        try {
            // GERÇEK API İSTEĞİ: api.bypass.vip (veya elindeki başka bir sağlam API)
            // encodeURIComponent kullanarak linkin bozulmasını önlüyoruz
            const response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`);
            
            // API'den gelen veriyi alıyoruz (API yapısına göre .result veya .key olabilir)
            const result = response.data.result || response.data.key;

            if (result) {
                const embed = new EmbedBuilder()
                    .setTitle('✅ Bypass Success')
                    .setColor(0x2f3136)
                    .setDescription(`Link başarıyla çözüldü! İşte gerçek sonucun:\n\n\`\`\`${result}\`\`\``)
                    .setTimestamp();

                const buttons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('res').setLabel('Başarılı').setStyle(ButtonStyle.Success).setDisabled(true),
                    new ButtonBuilder().setLabel('Sonuca Git').setStyle(ButtonStyle.Link).setURL(result.startsWith('http') ? result : 'https://google.com')
                );

                await interaction.editReply({ embeds: [embed], components: [buttons] });
            } else {
                throw new Error("API boş döndü.");
            }

        } catch (error) {
            console.error("Hata Detayı:", error.message);
            await interaction.editReply({ 
                content: `❌ **Bypass Başarısız!**\nSebep: API bu linki şu an çözemiyor veya link geçersiz.\nLink: \`${url}\`` 
            });
        }
    }

    // Mevcut destek sistemi handler'ın
    const supportCmd = client.commands.get('destek-kur');
    if (supportCmd && supportCmd.interactionHandler) {
        try { await supportCmd.interactionHandler(interaction); } catch (err) {}
    }
});

// 4. MESAJ TABANLI KOMUTLAR (!kur vb.)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (command && !command.data) {
        try { await command.execute(message, args); } catch (e) { console.log(e); }
    }
});

// 5. UPTIME & ANTI-CRASH
process.on('unhandledRejection', e => console.log('🛑 Hata:', e));
http.createServer((req, res) => { res.writeHead(200); res.end("REAL SYSTEM ONLINE"); }).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
