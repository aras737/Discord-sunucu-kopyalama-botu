const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rblx-kopyala')
        .setDescription('Roblox varlıklarını (Animasyon, Ses, Model) ISpooferMotion altyapısıyla bypass eder.')
        .addStringOption(option =>
            option.setName('tip')
                .setDescription('Kopyalamak istediğiniz varlık türü')
                .setRequired(true)
                .addChoices(
                    { name: '🏃 Animasyon (Animation Spoof)', value: 'animation' },
                    { name: '🎵 Ses / Müzik (Audio)', value: 'sound' },
                    { name: '📦 Model / Mesh / Kıyafet', value: 'model' }
                ))
        .addStringOption(option =>
            option.setName('id')
                .setDescription('Roblox Varlık (Asset) ID\'si')
                .setRequired(true)),

    async execute(interaction) {
        const type = interaction.options.getString('tip');
        const assetId = interaction.options.getString('id').trim();

        if (!/^\d+$/.test(assetId)) {
            return interaction.reply({ 
                content: '❌ Lütfen geçerli bir Roblox ID\'si girin (Sadece sayılardan oluşmalıdır).', 
                ephemeral: true 
            });
        }

        await interaction.deferReply();

        const ispooferHeaders = {
            'User-Agent': 'Roblox/WinInet RobloxApp/0.620.0.0 (GlobalDist; ClientChannel:production)',
            'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'X-Roblox-Channel': 'production',
            'Roblox-Place-Id': '606849621',
            'Roblox-Browser-Asset-Hash': 'true',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };

        const bypassRoutes = [
            `https://assetdelivery.roblox.com/v2/asset?id=${assetId}`,
            `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`,
            `https://roblox.com/asset/?id=${assetId}`
        ];

        let response = null;
        let finalData = null;

        for (const url of bypassRoutes) {
            try {
                const res = await fetch(url, { method: 'GET', headers: ispooferHeaders });

                if (res.ok) {
                    if (url.includes('/v2/asset')) {
                        const json = await res.json();
                        if (json && json.locations && json.locations[0] && json.locations[0].location) {
                            const downloadUrl = json.locations[0].location;
                            const finalRes = await fetch(downloadUrl, { method: 'GET', headers: ispooferHeaders });
                            if (finalRes.ok) {
                                const bufferCheck = await finalRes.clone().arrayBuffer();
                                // Gerçek Roblox verileri (ses/animasyon) en az 2-3 KB (2000+ byte) olur. 
                                // Kısa hata metinlerini ve sahte yanıtları engellemek için limiti yükseltiyoruz.
                                if (bufferCheck.byteLength > 1500) {
                                    response = finalRes;
                                    finalData = bufferCheck;
                                    break;
                                }
                            }
                        }
                    } else {
                        const bufferCheck = await res.clone().arrayBuffer();
                        // Gerçek veri kontrolü (Hata sayfaları genellikle çok küçüktür)
                        if (bufferCheck.byteLength > 1500) {
                            const textSample = new TextDecoder().decode(bufferCheck.slice(0, 100));
                            // Eğer dönen dosyanın başında "error" veya HTML etiketleri varsa bu bir hatadır
                            if (!textSample.includes('<roblox') && !textSample.includes('Error') && !textSample.includes('html')) {
                                response = res;
                                finalData = bufferCheck;
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.log(`Rota denemesi atlandı.`);
            }
        }

        // Eğer gerçekten geçerli bir dosya gelmediyse artık kesinlikle hata verecek
        if (!response || !finalData) {
            return interaction.editReply({ 
                content: '❌ **Geçersiz veya Korunan Varlık!**\nGirilen ID\'ye ait gerçek bir veri bulunamadı, varlık Roblox tarafından silinmiş veya Render sunucusunun IP engeli nedeniyle dosya içeriği çekilemedi.' 
            });
        }

        try {
            const buffer = Buffer.from(finalData);
            let fileName = '';
            let fileTitle = '';
            let fileEmoji = '';

            switch (type) {
                case 'animation':
                    fileName = `ispoofer_anim_${assetId}.rbxm`;
                    fileTitle = 'Animasyon Başarıyla Spoof Edildi';
                    fileEmoji = '🏃';
                    break;
                case 'sound':
                    fileName = `ispoofer_sound_${assetId}.mp3`;
                    fileTitle = 'Ses / Audio Başarıyla Çekildi';
                    fileEmoji = '🔊';
                    break;
                case 'model':
                    fileName = `ispoofer_model_${assetId}.rbxm`;
                    fileTitle = 'Model / Nesne Kopyalandı';
                    fileEmoji = '📦';
                    break;
            }

            const attachment = new AttachmentBuilder(buffer, { name: fileName });

            const embed = new EmbedBuilder()
                .setColor('#c21515')
                .setTitle(`${fileEmoji} ${fileTitle}!`)
                .setDescription(`Seçtiğin varlık korumalar altından doğrulanarak başarıyla çekildi.`)
                .addFields(
                    { name: 'Varlık Türü', value: `\`${type.toUpperCase()}\``, inline: true },
                    { name: 'Kaynak ID', value: `\`${assetId}\``, inline: true },
                    { name: 'Durum', value: `\`Doğrulanmış Gerçek Veri\``, inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            await interaction.editReply({ content: '❌ Dosya işlenirken dahili bir hata oluştu.' });
        }
    },
};
