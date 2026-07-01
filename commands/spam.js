const { SlashCommandBuilder } = require('discord.js');

// Geçici bellek
const spamCooldown = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('DM veya kanala mesaj spamlar (kontrollü).')

        .addStringOption(opt =>
            opt.setName('mesaj')
                .setDescription('Gönderilecek mesaj')
                .setRequired(true)
        )

        .addIntegerOption(opt =>
            opt.setName('adet')
                .setDescription('Kaç kere gönderilecek? (max 10)')
                .setRequired(true)
        )

        .addBooleanOption(opt =>
            opt.setName('dm')
                .setDescription('DM olarak gönderilsin mi? (true/false)')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;

        const mesaj = interaction.options.getString('mesaj');
        const adet = interaction.options.getInteger('adet');
        const dm = interaction.options.getBoolean('dm') || false;

        // 🔒 Limit koruması
        if (adet > 10) {
            return interaction.editReply('❌ 10’dan fazla spam yasak, abartma.');
        }

        // 🔥 cooldown (spam abuse engel)
        const now = Date.now();
        const cooldown = spamCooldown.get(userId);

        if (cooldown && now - cooldown < 15000) {
            return interaction.editReply('⏳ 15 saniye bekle, sürekli spam yapamazsın.');
        }

        spamCooldown.set(userId, now);

        try {
            if (dm) {
                // DM spam
                const user = await interaction.user.fetch();

                for (let i = 0; i < adet; i++) {
                    await user.send(`📩 ${mesaj}`).catch(() => null);
                }

                return interaction.editReply(`✅ DM üzerinden ${adet} mesaj gönderildi.`);
            } else {
                // Kanal spam
                for (let i = 0; i < adet; i++) {
                    await interaction.channel.send(`📢 ${mesaj}`);
                }

                return interaction.editReply(`✅ Kanalda ${adet} mesaj gönderildi.`);
            }

        } catch (err) {
            console.log(err);
            return interaction.editReply('❌ Bir hata oluştu, DM kapalı olabilir.');
        }
    }
};
