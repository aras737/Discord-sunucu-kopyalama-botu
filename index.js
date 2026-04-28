require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType } = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');
const fs = require('fs');

const TOKEN = process.env.DISCORD_BOT_TOKEN; 
const CLIENT_ID = '1394574380394221719';
const OWNER_ID = "1389930042200559706"; // Senin ID'n

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ ${client.user.tag} Aktif! !kur komutu ve /spam hazır.`);
});

// --- !KUR KOMUTU (MESAJ) ---
client.on('messageCreate', async (message) => {
    if (message.content === '!kur') {
        if (message.author.id !== OWNER_ID) return;

        const embed = new EmbedBuilder()
            .setTitle('⚙️ Aethelgard Sunucu Kopyalayıcı')
            .setColor('#5865F2')
            .setDescription('Sunucuyu klonlamak için aşağıdaki butona basın.')
            .setFooter({ text: 'Sadece yetkili kullanımı' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('copy_trigger').setLabel('Kopyalamayı Başlat').setStyle(ButtonStyle.Primary).setEmoji('🚀')
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

// --- ETKİLEŞİMLER (BUTON & MODAL) ---
client.on('interactionCreate', async (interaction) => {
    // Slash Komutlarını Çalıştır
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (command) await command.execute(interaction);
    }

    // !kur Butonu Yakalayıcı
    if (interaction.isButton() && interaction.customId === 'copy_trigger') {
        const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
        const modal = new ModalBuilder().setCustomId('copy_modal').setTitle('Klonlama Bilgileri');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('st').setLabel('Self Token').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('sid').setLabel('Kaynak ID').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('tid').setLabel('Hedef ID').setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    // Modal Submit İşlemleri (Kopyalama veya Spam)
    if (interaction.type === InteractionType.ModalSubmit) {
        const { handleModals } = require('./logic.js'); // İşlemleri temiz tutmak için ayrı dosya önerilir ama buraya da yazılabilir
        // Not: Kopyalama mantığını buraya veya logic dosyasına koyabilirsin.
    }
});

client.login(TOKEN);
