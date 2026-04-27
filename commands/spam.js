const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle,
    InteractionType 
} = require('discord.js');
const { Client: SelfClient } = require('discord.js-selfbot-v13');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Sunucuyu kopyalar ve kanallara spam efekti yapar.'),

    async execute(interaction) {
        // PANEL ARAYÜZÜ
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`: discord.gg/base64`)
            .addFields({ name: 'mesaj:', value: '7272' })
            .setFooter({ text: 'Sadece yetkililer görebilir' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('copy_btn')
                .setLabel('.gg/json')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        // BUTON VE MODAL YÖNETİMİ
        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'copy_btn') {
                const modal = new ModalBuilder()
                    .setCustomId('spam_modal')
                    .setTitle('Klonlama & Spam Bilgileri');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('s_token').setLabel('Self Token').setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('s_id').setLabel('Kaynak Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId('t_id').setLabel('Hedef Sunucu ID').setStyle(TextInputStyle.Short).setRequired(true)
                    )
                );
                await i.showModal(modal);
            }
        });
    }
};
