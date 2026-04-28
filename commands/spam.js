const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kur')
        .setDescription('Woodhook Style Sunucu Kopyalayıcı')
        .addStringOption(opt => opt.setName('kaynak_id').setDescription('Kopyalanacak Sunucu ID').setRequired(true)),

    async execute(interaction) {
        const OWNER_ID = "1389930042200559706";
        if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "❌ Yetki reddedildi.", ephemeral: true });

        const srcId = interaction.options.getString('kaynak_id');
        const src = interaction.client.guilds.cache.get(srcId);
        const trg = interaction.guild;

        if (!src) return interaction.reply({ content: "❌ Bot kaynak sunucuda bulunamadı!", ephemeral: true });

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🌀 Woodhook Klonlama Sistemi')
            .setDescription('**Durum:** İşlem Başlatılıyor...\n**Gecikme:** 1 Saniye');

        await interaction.reply({ embeds: [embed] });

        try {
            // Sunucu Ayarları
            await trg.setName(src.name).catch(() => {});
            if (src.iconURL()) await trg.setIcon(src.iconURL()).catch(() => {});

            // Kanal Temizliği
            const channels = await trg.channels.fetch();
            for (const ch of channels.values()) {
                await ch.delete().catch(() => {});
                await new Promise(r => setTimeout(r, 1000));
            }

            // Rol Kopyalama
            const srcRoles = (await src.roles.fetch()).filter(r => !r.managed && r.name !== '@everyone').sort((a,b) => a.position - b.position);
            for (const r of srcRoles.values()) {
                await trg.roles.create({ name: r.name, color: r.color, permissions: r.permissions, hoist: r.hoist, mentionable: r.mentionable }).catch(() => {});
                await new Promise(r => setTimeout(r, 1000));
            }

            // Kategori ve Kanal İnşası
            const srcChans = await src.channels.fetch();
            const cats = srcChans.filter(c => c.type === ChannelType.GuildCategory).sort((a,b) => a.position - b.position);

            for (const cat of cats.values()) {
                const newCat = await trg.channels.create({ name: cat.name, type: ChannelType.GuildCategory }).catch(() => null);
                await new Promise(r => setTimeout(r, 1000));
                if (newCat) {
                    const children = srcChans.filter(c => c.parentId === cat.id).sort((a,b) => a.position - b.position);
                    for (const ch of children.values()) {
                        await trg.channels.create({ name: ch.name, type: ch.type, parent: newCat.id }).catch(() => {});
                        await new Promise(r => setTimeout(r, 1000));
                    }
                }
            }
            embed.setColor('#2ECC71').setDescription('✅ **Klonlama Başarılı!**');
            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.error(e);
        }
    }
};
