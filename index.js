require('dotenv').config();
const { 
    Client, GatewayIntentBits, Collection, REST, Routes, 
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios'); // GERÇEK BYPASS İÇİN ŞART

// 1. BOT AYARLARI VE İZİNLER
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

// 2. KOMUTLARI TARA VE YÜKLE
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

// 3. HAZIR OLMA VE SLASH KAYDI
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Gerçek Bypass Moduyla Aktif!`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: client.slashCommands });
        console.log("✨ Komutlar senkronize edildi.");
    } catch (error) { console.error("❌ Kayıt Hatası:", error); }
});

// 4. ETKİLEŞİM YÖNETİMİ
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    // --- GERÇEK BYPASS İŞLEMİ BURADA BAŞLIYOR ---
    if (interaction.isModalSubmit() && interaction.customId === 'bypassModal') {
        const url = interaction.fields.getTextInputValue('urlInput');
        
        // Kullanıcıya "bekle geliyorum" diyoruz (Videodaki akış için)
        await interaction.deferReply({ ephemeral: false });

        try {
            // Gerçek Bypass API İsteği (Ethone API örneği)
            // Bu API Platorelay, Linkvertise gibi sitelerin çoğunu destekler.
            const response = await axios.get(`https://ethone.live/api/bypass?url=${encodeURIComponent(url)}`);
            
            // API'den gelen veriyi alıyoruz
            // Not: API yapısına göre response.data.result veya response.data.key değişebilir.
            const result = response.data.result || response.data.key || "Key Bulunamadı";

            const embed = new EmbedBuilder()
                .setTitle('✅ Bypass Success')
                .setColor(0x2f3136)
                .setDescription(`Sistem linki başarıyla analiz etti ve bypassladı!\n\n**Sonuç/Key:**\n\`\`\`${result}\`\`\``)
                .setFooter({ text: `Kullanılan Link: ${url.substring(0, 40)}...` })
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('result').setLabel('Result').setStyle(ButtonStyle.Secondary).setDisabled(true),
                new ButtonBuilder().setCustomId('server').setLabel('Server').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setLabel('Website').setStyle(ButtonStyle.Link).setURL(url.startsWith('http') ? url : 'https://google.com')
            );

            await interaction.editReply({ embeds: [embed], components: [buttons] });

        } catch (error) {
            console.error("Bypass Hatası:", error.response ? error.response.data : error.message);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Bypass Failed')
                .setColor(0xff0000)
                .setDescription(`Maalesef bu link bypass edilemedi. Link geçersiz olabilir veya API şu an yoğun olabilir.`)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }

    // DESTEK SİSTEMİ BUTONLARI
    const supportCmd = client.commands.get('destek-kur');
    if (supportCmd && supportCmd.interactionHandler) {
        try { await supportCmd.interactionHandler(interaction); } catch (err) {}
    }
});

// 5. MESAJ TABANLI KOMUTLAR (!kur)
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith("!")) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (command && !command.data) {
        try { await command.execute(message, args); } catch (error) { message.reply("❌ Hata!"); }
    }
});

// 6. AYAKTA TUT
process.on('unhandledRejection', e => console.log('🛑 Hata:', e));
process.on('uncaughtException', e => console.log('🛑 Hata:', e));

http.createServer((req, res) => { res.writeHead(200); res.end("REAL BYPASS ONLINE"); }).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
