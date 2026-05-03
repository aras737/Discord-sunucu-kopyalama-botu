require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, REST, Routes, 
    ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios'); // Bypass API istekleri için

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
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
    console.log(`✅ ${client.user.tag} Aktif!`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: client.slashCommands },
        );
        console.log("✨ Slash komutları senkronize edildi.");
    } catch (error) {
        console.error("❌ Kayıt Hatası:", error);
    }
});

// 3. ETKİLEŞİM YÖNETİMİ (VİDEODAKİ SİSTEMİN KALBİ)
client.on('interactionCreate', async (interaction) => {
    
    // A. SLASH KOMUTLARI (Örn: /bypass)
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'bypass') {
            // Videodaki Modal'ı (Formu) Oluştur
            const modal = new ModalBuilder()
                .setCustomId('bypassModal')
                .setTitle('Zen Bypass');

            const urlInput = new TextInputBuilder()
                .setCustomId('urlInput')
                .setLabel("Bypass edilecek URL'yi girin")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://auth.platorelay.com/...')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
            await interaction.showModal(modal);
        } else {
            const command = client.commands.get(interaction.commandName);
            if (command) await command.execute(interaction);
        }
    }

    // B. MODAL GÖNDERİLDİĞİNDE (VİDEODAKİ GİRİŞ EKRANI)
    if (interaction.isModalSubmit() && interaction.customId === 'bypassModal') {
        const url = interaction.fields.getTextInputValue('urlInput');
        
        await interaction.deferReply({ ephemeral: false });

        try {
            // Bypass API Simülasyonu (Buraya kendi API linkini koymalısın)
            // const response = await axios.get(`https://api.bypass.vip/bypass?url=${url}`);
            // const key = response.data.key;
            const mockKey = "FREE_8C114EDFA55888FF6D5DC7775A584C69"; // Videodaki örnek key

            const embed = new EmbedBuilder()
                .setTitle('✅ Bypass Success')
                .setColor(0x2f3136)
                .setDescription(`Your key has been retrieved. Copy it and input it into the application.\n\n\`\`\`${mockKey}\`\`\``)
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('result').setLabel('Result').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('server').setLabel('Server').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setLabel('Website').setStyle(ButtonStyle.Link).setURL('https://google.com')
            );

            await interaction.editReply({ embeds: [embed], components: [buttons] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Bypass işlemi başarısız oldu.' });
        }
    }

    // C. DESTEK SİSTEMİ HANDLER (Senin mevcut yapın)
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
        try { await command.execute(message, args); } catch (e) { message.reply("❌ Hata!"); }
    }
});

// 5. UPTIME & ANTI-CRASH
process.on('unhandledRejection', e => console.log('🛑 Red Hatası:', e));
process.on('uncaughtException', e => console.log('🛑 Exception Hatası:', e));

http.createServer((req, res) => {
    res.writeHead(200);
    res.end("ZEN BYPASS SYSTEM ONLINE");
}).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
