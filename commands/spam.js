const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Forces şık paneli ile her yerde gelişmiş mesaj gönderimi sağlar.')
        .addStringOption(o =>
            o.setName('mesaj')
             .setDescription('Gönderilecek metin içeriği')
             .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName('miktar')
             .setDescription('Gönderilecek mesaj sayısı (1-50)')
             .setRequired(true)
             .setMinValue(1)
             .setMaxValue(50)
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const mesaj      = interaction.options.getString('mesaj');
        const miktar     = interaction.options.getInteger('miktar');
        const benzersizId = `forces_${interaction.id}`;

        /* ═══════════════════════════════════════════════════════════
           PANEL EMBED — Görseldeki birebir yapı
           • Renk: Kırmızı tonu (#ff0033)
           • Başlık: ☄️ Abone Modu Aktif
           • Açıklama + 4 field (satır içi / satır dışı)
           • Footer: Forces • Spam Sistemi | Güç Merkezi | Işığın Sesi
           • Timestamp
           • Gradient görsel
        ═══════════════════════════════════════════════════════════ */
        const panelEmbed = new EmbedBuilder()
            .setColor('#ff0033')
            .setTitle('☄️ Abone Modu Aktif')
            .setDescription('Mesajını sunucu genelinde göndermek için aşağıdaki kırmızı butona tıkla.')
            .addFields(
                { name: '💬 Mesaj Content',       value: `\`\`\`text\n${mesaj}\n\`\`\``, inline: false },
                { name: '🔢 Gönderilecek Miktar', value: `\`${miktar} adet\``,            inline: true  },
                { name: '⚙️ Gönderim Modu',       value: '`Abone Ultra`',                inline: true  },
                { name: '⏱️ Çekirdek Gecikme',    value: '`750ms`',                      inline: true  }
            )
            .setImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000')
            .setFooter({
                text:    'Forces • Spam Sistemi | Güç Merkezi | Işığın Sesi',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        /* ── Buton ──────────────────────────────────────────────── */
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(benzersizId)
                .setLabel('🚀 Başlat!')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.editReply({ embeds: [panelEmbed], components: [row] });

        /* ── Collector ──────────────────────────────────────────── */
        const filter    = i => i.customId === benzersizId && i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({ filter, time: 120_000 });

        collector.on('collect', async (btnInteraction) => {

            /* ❶ Butonu anında deaktif et — çift tıklamayı önle */
            const aktifRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(benzersizId)
                    .setLabel('⏳ Gönderiliyor…')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
            await btnInteraction.update({ components: [aktifRow] });

            /* ❷ Kullanıcıya ephemeral bilgilendirme */
            await btnInteraction.followUp({
                content: `⚡ **Forces Spam Sistemi | Işığın Sesi:** \`${miktar}\` adet mesaj fırlatılıyor…`,
                flags: MessageFlags.Ephemeral
            });

            /* ❸ Kanalı güvenle al */
            const kanal = btnInteraction.channel
                ?? await interaction.client.channels.fetch(interaction.channelId).catch(() => null);

            if (!kanal) {
                await btnInteraction.followUp({
                    content: '❌ Kanal bulunamadı, gönderim iptal edildi.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            /* ❹ Mesaj gönderim döngüsü */
            let gonderilen = 0;

            for (let i = 0; i < miktar; i++) {
                try {
                    /* Benzersiz suffix — Discord duplicate korumasını aş */
                    const suffix = `\u200b${'‌'.repeat(i % 3 + 1)}`;
                    await kanal.send({ content: mesaj + suffix });
                    gonderilen++;
                } catch (err) {
                    console.warn(`[Forces Spam] #${i + 1} gönderilemedi:`, err.message);
                    /* Rate-limit / yetki hatası → 3 saniye mola + 1 yeniden deneme */
                    await new Promise(r => setTimeout(r, 3000));
                    try {
                        await kanal.send({ content: mesaj + `\u200b${'‌'.repeat((i + 5) % 3 + 1)}` });
                        gonderilen++;
                    } catch {
                        console.warn(`[Forces Spam] #${i + 1} yeniden deneme başarısız, atlanıyor.`);
                    }
                }

                /* 750ms bekleme — Discord rate-limit ile uyumlu */
                await new Promise(r => setTimeout(r, 750));
            }

            /* ❺ Sonuç bildirimi */
            await btnInteraction.followUp({
                content: `✅ **Forces • Spam Sistemi | Işığın Sesi:** \`${gonderilen}/${miktar}\` mesaj gönderildi.`,
                flags: MessageFlags.Ephemeral
            }).catch(() => {});

            /* ❻ Paneli tamamlandı olarak güncelle */
            const tamamRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(benzersizId)
                    .setLabel('✅ Tamamlandı')
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
            );
            await interaction.editReply({ components: [tamamRow] }).catch(() => {});
        });

        /* ── Collector süresi dolunca ───────────────────────────── */
        collector.on('end', async () => {
            const sureDolduRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(benzersizId)
                    .setLabel('Süre Doldu!')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
            await interaction.editReply({ components: [sureDolduRow] }).catch(() => {});
        });
    }
};
