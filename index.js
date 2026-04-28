require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Üye listesini görmek için ŞART!
        GatewayIntentBits.DirectMessages
    ]
});

const OWNER_ID = "1389930042200559706";

const commands = [
    new SlashCommandBuilder()
        .setName('dm-raid')
        .setDescription('Sunucudaki herkese DM üzerinden mesaj yağdırır.')
        .addStringOption(opt => opt.setName('mesaj').setDescription('Gönderilecek DM içeriği').setRequired(true))
].map(c => c.toJSON());

client.on('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log(`☣️ DM RAID MAKİNESİ AKTİF: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.user.id !== OWNER_ID) return interaction.reply("❌ Bu işlem yasak.");

    if (interaction.commandName === 'dm-raid') {
        const text = interaction.options.getString('mesaj');
        const guild = interaction.guild;

        await interaction.reply({ content: "🚀 **DM Operasyonu Başladı.** Üyeler taranıyor...", ephemeral: true });

        try {
            // Sunucudaki tüm üyeleri çek
            const members = await guild.members.fetch();
            let basarili = 0;
            let hatali = 0;

            // Her üyeye tek tek DM at
            for (const member of members.values()) {
                if (member.user.bot) continue; // Botlara DM atma

                try {
                    await member.send(text);
                    basarili++;
                    console.log(`✅ DM Gönderildi: ${member.user.tag}`);
                    
                    // Discord banlamasın diye 1.5 saniye bekleme (Rate limit koruması)
                    await new Promise(r => setTimeout(r, 1500)); 
                } catch (err) {
                    hatali++;
                    console.log(`❌ DM Kapatılmış: ${member.user.tag}`);
                }
            }

            console.log(`📊 Operasyon Tamam: ${basarili} Başarılı, ${hatali} Kapalı DM.`);
        } catch (err) {
            console.error("Üye listesi çekilemedi:", err);
        }
    }
});

http.createServer((req, res) => res.end("DM Raid Online")).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_BOT_TOKEN);
