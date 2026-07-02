const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spam')
        .setDescription('Forces paneli ile erişilebilen HER yere spam mesaj gönderimi sağlar.')
        .addStringOption(o =>
            o.setName('mesaj')
             .setDescription('Gönderilecek metin içeriği')
             .setRequired(true)
        )
        .addIntegerOption(o =>
            o.setName('miktar')
             .setDescription('Her hedefe gönderilecek mesaj sayısı (1-20)')
             .setRequired(true)
             .setMinValue(1)
             .setMaxValue(20)
        )
        .addStringOption(o =>
            o.setName('hedef')
             .setDescription('Spam hedefi')
             .setRequired(false)
             .addChoices(
                 { name: '🌍 Her Yer (Tüm Kanallar + DM)', value: 'all' },
                 { name: '📢 Sadece Kanallar',              value: 'channels' },
                 { name: '📩 Sadece DM',                    value: 'dm' }
             )
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const mesaj       = interaction.options.getString('mesaj');
        const miktar      = interaction.options.getInteger('miktar');
        const hedefModu   = interaction.options.getString('hedef') ?? 'all';
        const benzersizId = `forces_${interaction.id}`;

        /* ═══════════════════════════════════════════════════════════
           PANEL EMBED
        ═══════════════════════════════════════════════════════════ */
        const hedefLabel = {
            all:      '🌍 Her Yer (Kanallar + DM)',
            channels: '📢 Sadece Kanallar',
            dm:       '📩 Sadece DM'
        }[hedefModu];

        const panelEmbed = new EmbedBuilder()
            .setColor('#ff0033')
            .setTitle('☄️ Abone Modu Aktif')
            .setDescription('Mesajını erişilebilen HER yere göndermek için aşağıdaki kırmızı butona tıkla.')
            .addFields(
                { name: '💬 Mesaj Content',       value: `\`\`\`text\n${mesaj}\n\`\`\``, inline: false },
                { name: '🔢 Gönderilecek Miktar', value: `\`${miktar} adet / hedef\``,   inline: true  },
                { name: '🎯 Hedef Modu',          value: `\`${hedefLabel}\``,            inline: true  },
                { name: '⚙️ Gönderim Modu',       value: '`Abone Ultra`',               inline: true  },
                { name: '⏱️ Çekirdek Gecikme',    value: '`750ms`',                      inline: true  }
            )
            .setImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000')
            .setFooter({
                text:    'Forces • Spam Sistemi | Güç Merkezi | Işığın Sesi',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(benzersizId)
                .setLabel('🚀 Başlat!')
                .setStyle(ButtonStyle.Danger)
        );

        const response = await interaction.editReply({ embeds: [panelEmbed], components: [row] });

        /* ── Collector ──────────────────────────────────────────── */
        const filter    = i => i.customId === benzersizId && i.user.id === interaction.user.id;
        const collector = response.createMessageComponentCollector({ filter, time: 300_000 });

        collector.on('collect', async (btnInteraction) => {

            /* ❶ Butonu deaktif et */
            const aktifRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(benzersizId)
                    .setLabel('⏳ Taranıyor & Gönderiliyor…')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
            await btnInteraction.update({ components: [aktifRow] });

            /* ❷ Bilgilendirme */
            await btnInteraction.followUp({
                content: `⚡ **Forces Spam Sistemi | Işığın Sesi:** Hedefler taranıyor, \`${miktar}\` adet mesaj her yere fırlatılıyor…`,
                flags: MessageFlags.Ephemeral
            });

            let toplamGonderilen = 0;
            let toplamHedef      = 0;

            /* ═══════════════════════════════════════════════════════
               YARDIMCI: Tek bir kanala miktar kadar mesaj at
            ═══════════════════════════════════════════════════════ */
            async function kanalaGonder(kanal) {
                for (let i = 0; i < miktar; i++) {
                    try {
                        const suffix = `\u200b${'‌'.repeat(i % 3 + 1)}`;
                        await kanal.send({ content: mesaj + suffix });
                        toplamGonderilen++;
                    } catch (err) {
                        console.warn(`[Forces] Kanal #${kanal.name} mesaj #${i + 1} başarısız:`, err.message);
                        await new Promise(r => setTimeout(r, 3000));
                        try {
                            await kanal.send({ content: mesaj + `\u200b${'‌'.repeat((i + 5) % 3 + 1)}` });
                            toplamGonderilen++;
                        } catch { /* atla */ }
                    }
                    await new Promise(r => setTimeout(r, 750));
                }
                toplamHedef++;
            }

            /* ═══════════════════════════════════════════════════════
               YARDIMCI: Bir üyeye DM olarak miktar kadar mesaj at
            ═══════════════════════════════════════════════════════ */
            async function dmyeGonder(uye) {
                /* Bot'un kendine ve komutu kullanan kişiye DM atmasını istemezsek burayı aç: */
                // if (uye.id === interaction.client.user.id || uye.id === interaction.user.id) return;

                try {
                    const dm = await uye.createDM();
                    for (let i = 0; i < miktar; i++) {
                        try {
                            const suffix = `\u200b${'‌'.repeat(i % 3 + 1)}`;
                            await dm.send({ content: mesaj + suffix });
                            toplamGonderilen++;
                        } catch (err) {
                            console.warn(`[Forces] DM → ${uye.user?.tag ?? uye.tag} mesaj #${i + 1} başarısız:`, err.message);
                            await new Promise(r => setTimeout(r, 3000));
                            try {
                                await dm.send({ content: mesaj + `\u200b${'‌'.repeat((i + 5) % 3 + 1)}` });
                                toplamGonderilen++;
                            } catch { /* atla */ }
                        }
                        await new Promise(r => setTimeout(r, 750));
                    }
                    toplamHedef++;
                } catch (err) {
                    console.warn(`[Forces] DM açılamadı → ${uye.user?.tag ?? uye.tag}:`, err.message);
                }
            }

            /* ═══════════════════════════════════════════════════════
               ADIM 1 — BOT'UN ERİŞEBİLDİĞİ TÜM SUNUCULARI TARA
            ═══════════════════════════════════════════════════════ */
            const guilds = interaction.client.guilds.cache;

            for (const [guildId, guild] of guilds) {

                /* ── KANALLARA GÖNDER ──────────────────────────── */
                if (hedefModu === 'all' || hedefModu === 'channels') {
                    try {
                        const kanallar = await guild.channels.fetch();
                        const metinKanallari = kanallar.filter(c =>
                            c && c.isTextBased() && c.viewable && c.sendable
                        );

                        for (const [chanId, kanal] of metinKanallari) {
                            await kanalaGonder(kanal);
                        }
                    } catch (err) {
                        console.warn(`[Forces] ${guild.name} kanallar taranamadı:`, err.message);
                    }
                }

                /* ── DM'LERE GÖNDER (Sunucu üyelerine) ─────────── */
                if (hedefModu === 'all' || hedefModu === 'dm') {
                    try {
                        const uyeler = await guild.members.fetch({ force: true });
                        /* Bot'lar hariç, kendin ve botunun kendisi hariç */
                        const hedefUyeler = uyeler.filter(m =>
                            !m.user.bot &&
                            m.id !== interaction.client.user.id &&
                            m.id !== interaction.user.id
                        );

                        for (const [memberId, member] of hedefUyeler) {
                            await dmyeGonder(member);
                        }
                    } catch (err) {
                        console.warn(`[Forces] ${guild.name} üyeler taranamadı:`, err.message);
                    }
                }
            }

            /* ═══════════════════════════════════════════════════════
               ADIM 2 — ÖZEL (GROUP) DM'LER (varsa)
            ═══════════════════════════════════════════════════════ */
            // Discord.js v14'de group DM'ler doğrudan desteklenmez,
            // ama bot'un DM channel cache'inde olanlara atabilir:
            if (hedefModu === 'all' || hedefModu === 'dm') {
                const dmChannels = interaction.client.channels.cache.filter(c => c.isDMBased());
                for (const [dmId, dmChan] of dmChannels) {
                    try {
                        for (let i = 0; i < miktar; i++) {
                            const suffix = `\u200b${'‌'.repeat(i % 3 + 1)}`;
                            await dmChan.send({ content: mesaj + suffix });
                            toplamGonderilen++;
                            await new Promise(r => setTimeout(r, 750));
                        }
                        toplamHedef++;
                    } catch { /* atla */ }
                }
            }

            /* ═══════════════════════════════════════════════════════
               SONUÇ RAPORU
            ═══════════════════════════════════════════════════════ */
            const raporEmbed = new EmbedBuilder()
                .setColor('#00ff44')
                .setTitle('✅ Forces Spam Tamamlandı')
                .addFields(
                    { name: '📊 Toplam Mesaj',  value: `\`${toplamGonderilen}\``,  inline: true },
                    { name: '🎯 Toplam Hedef',   value: `\`${toplamHedef}\``,       inline: true },
                    { name: '⚙️ Hedef Modu',     value: `\`${hedefLabel}\``,        inline: true }
                )
                .setFooter({
                    text:    'Forces • Spam Sistemi | Güç Merkezi | Işığın Sesi',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await btnInteraction.followUp({
                embeds: [raporEmbed],
                flags: MessageFlags.Ephemeral
            }).catch(() => {});

            /* Paneli güncelle */
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
