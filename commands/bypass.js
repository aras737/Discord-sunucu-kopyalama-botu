const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} = require('discord.js');

// Bekleme sürelerini hafızada tutmak için Map
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Reklamlı linkleri geçer ve anahtarınızı (key) getirir.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 60 * 1000; // 60 saniye bekleme süresi

        // 1. COOLDOWN KONTROLÜ (Videodaki hata mesajı)
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ 
                    content: `❌ | Please wait ${timeLeft.toFixed(1)} more second(s) before using the bypass command.`, 
                    ephemeral: true 
                });
            }
        }

        // Cooldown'ı başlat
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        // 2. MODAL (FORM) OLUŞTURMA
        const modal = new ModalBuilder()
            .setCustomId('bypassModal')
            .setTitle('Zen Bypass');

        const urlInput = new TextInputBuilder()
            .setCustomId('urlInput')
            .setLabel("Bypass edilecek URL'yi girin")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://auth.platorelay.com/...')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(urlInput);
        modal.addComponents(firstActionRow);

        // Modalı kullanıcıya göster
        await interaction.showModal(modal);
    },
};
