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

        // 🚀 ISPOOFERMOTION ENGINE & CLIENT SPOOF HEADERS
        // Roblox'un animasyon motorunu ve Studio alt istemcisini tamamen taklit eden başlıklar
        const ispooferHeaders = {
            'User-Agent': 'Roblox/WinInet RobloxApp/0.620.0.0 (GlobalDist; ClientChannel:production)',
            'Accept': 'application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.9',
            'X-Roblox-Channel': 'production',
            'Roblox-Place-Id': '606849621', // ISpoofer tarzı yüksek erişimli kalıplaşmış Place ID
            'Roblox-Browser-Asset-Hash': 'true',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        };

        // ISpoofer altyapısında kullanılan ve IP engellerini delen alternatif CDN ve API rotaları
        const bypassRoutes = [
            `https://assetdelivery.roblox.com/v2/asset?id=${assetId}`,
            `https://assetdelivery.roblox.com/v1/asset/?id=${assetId}`,
            `https://assetdelivery.roblox.com/v1/assetId/${assetId}`,
            `https://roblox.com/asset/?id=${assetId}`
        ];

        let response = null;
        let finalData = null;

        // Rotaları sırayla zorla (Engine Spoofing)
        for (const url of bypassRoutes) {
            try {
                const res = await fetch(url, { 
                    method: 'GET', 
                    headers: ispooferHeaders
                });

                if (res.ok) {
                    // v2 API'leri bazen direkt dosyayı değil indirme linkini içeren JSON döner
                    if (url.includes('/v2/asset')) {
                        const json = await res.json();
                        if (json && json.locations && json.locations[0] && json.locations[0].location) {
                            const downloadUrl = json.locations[0].location;
                            // Gerçek indirme linkine tekrar spoof headers ile istek atıyoruz
                            const finalRes = await fetch(downloadUrl, { method: 'GET', headers: ispooferHeaders });
                            if (finalRes.ok) {
                                const bufferCheck = await finalRes.clone().arrayBuffer();
                                if (bufferCheck.byteLength > 100) {
                                    response = finalRes;
                                    finalData = bufferCheck;
                                    break;
                                }
                            }
                        }
                    } else {
                        // v1 veya düz asset linkleri direkt buffer döner
                        const bufferCheck = await res.clone().arrayBuffer();
                        if (bufferCheck.byteLength > 100) {
                            response = res;
                            finalData = bufferCheck;
                            break;
                        }
                    }
                }
            } catch (err) {
                console.log(`ISpoofer Rota denemesi başarısız, diğerine geçiliyor...`);
            }
        }

        if (!response || !finalData) {
            return interaction.editReply({ 
                content: '❌ **ISpoofer Bypass Başarısız!**\nRoblox güvenlik duvarı aşılamadı. Animasyon/Ses ya tamamen silinmiş ya da Render IP bloku bu rota için de çok katı. ID\'yi kontrol edin.' 
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
                .setColor('#c21515') // ISpoofer Kırmızısı
                .setTitle(`${fileEmoji} ${fileTitle}!`)
                .setDescription(`Seçtiğin varlık **ISpooferMotion Engine v4** bypass modülü kullanılarak Roblox korumaları altından başarıyla çekildi.`)
                .addFields(
                    { name: 'Varlık Türü', value: `\`${type.toUpperCase()}\``, inline: true },
                    { name: 'Kaynak ID', value: `\`${assetId}\``, inline: true },
                    { name: 'Bypass Entegrasyonu', value: `\`ISpooferMotion Core (Node-v24)\``, inline: false },
                    { name: 'Roblox Bağlantısı', value: `[Varlık Sayfası](https://www.roblox.com/library/${assetId})`, inline: false }
                )
                .setFooter({ text: 'Aethelgard Sunucu Kopyalayıcı & ISpooferMotion' })
                .setTimestamp();

            if (type === 'animation' || type === 'model') {
                embed.addFields({ 
                    name: '💡 Roblox Studio\'ya Aktarma', 
                    value: 'İndirdiğin `.rbxm` dosyasını Roblox Studio projen açıkken direkt ekranın ortasına sürükle-bırak yaparsan animasyonun/modelin tüm keyframeleri ve kemik yapıları (Rig) içeri aktarılır.' 
                });
            }

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('ISpoofer İşleme Hatası:', error);
            await interaction.editReply({ content: '❌ Dosya dönüştürülürken dahili bir hata oluştu.' });
        }
    },
};
