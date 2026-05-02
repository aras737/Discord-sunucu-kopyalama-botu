require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const http = require('http');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CLIENT_ID = "1389930042200559706";

// 1. KOMUT TANIMI
const commands = [{
    name: 'spam',
    description: 'Herkesin gorebilecegi seri mesaj.',
    options: [
        { name: 'mesaj', type: 3, description: 'Icerik', required: true },
        { name: 'miktar', type: 4, description: 'Adet', required: false }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
}];

// 2. BOT HAZIR OLDUĞUNDA
client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} Aktif!`);
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log("✨ Komutlar yuklendi.");
    } catch (e) { console.error(e); }
});

// 3. ANA SPAM MANTIGI (Görseldeki hatayı çözen kısım)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'spam') return;

    const msg = interaction.options.getString('mesaj');
    const amount = interaction.options.getInteger('miktar') || 20;

    // "Düşünüyor..." yazısını hemen silip "Başladı" mesajı verir (Görseldeki hatayı bitirir)
    await interaction.reply({ content: '🔥 **Bombardiman basladi!**', ephemeral: true });

    let sent = 0;
    const interval = setInterval(async () => {
        if (sent >= amount) {
            clearInterval(interval);
            return;
        }

        try {
            // WEBHOOK ÜZERİNDEN GENEL MESAJ (flags: 0 sayesinde herkes görür)
            await client.rest.post(
                Routes.webhookMessage(interaction.applicationId, interaction.token),
                { body: { content: msg, flags: 0 } }
            );
            sent++;
        } catch (err) {
            console.log("Mermi takildi, devam ediliyor...");
            if (err.status !== 429) clearInterval(interval);
        }
    }, 850);
});

// Uptime (Render için)
http.createServer((req, res) => { res.write("Active"); res.end(); }).listen(process.env.PORT || 3000);

client.login(TOKEN);
