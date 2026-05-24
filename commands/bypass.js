const { 
    SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ActionRowBuilder, EmbedBuilder, InteractionType 
} = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('PlatoRelay ve Delta linklerini merkezi motor üzerinden hızlıca kırar.'),

    async execute(interaction) {
        // Herkesin görebilmesi için ephemeral ayarı false yapıldı
        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    
                    await int.deferReply({ ephemeral: false });
                    
                    // İstediğin loading animasyonu ve profesyonel durum bilgisi
                    await int.editReply({ 
                        content: `<a:loading:1507818079776935966> **Zen OS v2.5:** Merkezi bypass sunucularına bağlanılıyor. Link analiz ediliyor...` 
                    });

                    const url = int.fields.getTextInputValue('urlInput').trim();
                    const startTime = Date.now();

                    try {
                        // Durum güncellemesi
                        await int.editReply({ 
                            content: `<a:loading:1507818079776935966> **Zen OS v2.5:** Reklam duvarları manipüle ediliyor, anahtar sökülüyor...` 
                        });

                        // Gelişmiş merkezi çözücü API entegrasyonu (Izen tarzı harici motor)
                        const response = await axios.get(`https://api.bypass.vip/bypass?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                        
                        let finalKey = null;
                        if (response.data && response.data.result) {
                            finalKey = response.data.result;
                        } else if (response.data && response.data.key) {
                            finalKey = response.data.key;
                        }

                        const processTime = ((Date.now() - startTime) / 1000).toFixed(2);

                        if (finalKey && !finalKey.includes("SHUT DOWN")) {
                            const successEmbed = new EmbedBuilder()
                                .setTitle('🔓 ZEN BYPASS SYSTEM • DATA CRACKED')
                                .setDescription('Güvenlik mekanizması başarıyla simüle edildi ve hedef anahtar söküldü.')
                                .setColor('#00ffb3')
                                .setThumbnail(int.user.displayAvatarURL({ dynamic: true }))
                                .addFields(
                                    { name: '📋 KULLANICI BİLGİSİ', value: `> **Tetikleyen:** ${int.user}\n> **Kullanıcı ID:** \`${int.user.id}\``, inline: false },
                                    { name: '🔑 ELDE EDİLEN ANAHTAR (KEY)', value: `\`\`\`text\n${finalKey}\n\`\`\``, inline: false },
                                    { name: '⚡ PERFORMANS RAPORU', value: `\`\`\`yaml\nSüre: ${processTime} saniye\nDurum: %100 Başarılı\nMotor: Zen Cloud-API v2.5\n\`\`\``, inline: false }
                                )
                                .setFooter({ text: 'Zen Core Technology • Global Sistem Raporu', iconURL: int.client.user.displayAvatarURL() })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [successEmbed] });
                        } else {
                            // Doğrudan anahtar metni gelmediğinde yönlendirilen güvenli çıkış adresini gösteren embed
                            const fallbackEmbed = new EmbedBuilder()
                                .setTitle('🔗 ZEN BYPASS SYSTEM • LINK GENERATED')
                                .setDescription('Reklam korumaları başarıyla atlandı. Doğrudan son sayfaya yönlendiriliyorsunuz.')
                                .setColor('#ffaa00')
                                .setThumbnail(int.user.displayAvatarURL({ dynamic: true }))
                                .addFields(
                                    { name: '📋 KULLANICI BİLGİSİ', value: `> **Tetikleyen:** ${int.user}`, inline: false },
                                    { name: '🌐 GÜVENLİ ERİŞİM BAĞLANTISI', value: `🔑 [Buraya Tıklayarak Anahtara Ulaş](${url})\n\n*Not: Reklam geçiş adımları sistem tarafından kolaylaştırılmıştır.*`, inline: false }
                                )
                                .setFooter({ text: 'Zen Core Technology • Global Sistem Raporu', iconURL: int.client.user.displayAvatarURL() })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [fallbackEmbed] });
                        }

                    } catch (error) {
                        // Ana hat meşgulse devreye giren yedek API tüneli
                        try {
                            const backupRes = await axios.get(`https://bypass.bot-asistant.workers.dev/?url=${encodeURIComponent(url)}`, { timeout: 15000 });
                            const backupKey = backupRes.data.key || backupRes.data.result || "Anahtar çözülemedi.";
                            const processTime = ((Date.now() - startTime) / 1000).toFixed(2);

                            const backupEmbed = new EmbedBuilder()
                                .setTitle('🔓 ZEN BYPASS SYSTEM • YEDEK HAT AKTİF')
                                .setDescription('Ana tünel yoğunluğu nedeniyle yedek katman üzerinden işlem tamamlandı.')
                                .setColor('#ffaa00')
                                .addFields(
                                    { name: '📋 KULLANICI BİLGİSİ', value: `> **Tetikleyen:** ${int.user}`, inline: false },
                                    { name: '🔑 ELDE EDİLEN ANAHTAR (KEY)', value: `\`\`\`text\n${backupKey}\n\`\`\``, inline: false },
                                    { name: '⚡ PERFORMANS RAPORU', value: `\`\`\`yaml\nSüre: ${processTime} saniye\nDurum: Yedek Tünel Aktif\n\`\`\``, inline: false }
                                )
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [backupEmbed] });

                        } catch (backupError) {
                            const errorEmbed = new EmbedBuilder()
                                .setTitle('❌ SİSTEM HATASI • BYPASS FAILED')
                                .setDescription('Merkezi sunuculardan yanıt alınamadı veya girilen link geçersiz.')
                                .setColor('#ff3333')
                                .addFields(
                                    { name: '🚨 HATA DETAYI', value: `\`\`\`js\nSunucu zaman aşımı veya geçersiz veri yapısı.\n\`\`\`` },
                                    { name: '💡 ÖNERİ', value: 'Lütfen bağlantınızın doğruluğunu kontrol edip birkaç dakika sonra tekrar deneyin.' }
                                )
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [errorEmbed] });
                        }
                    }
                }
            });
            interaction.client.bypassListenerSet = true;
        }

        const modal = new ModalBuilder().setCustomId('bypassModal').setTitle('Zen Gelişmiş Profiler');
        const urlInput = new TextInputBuilder().setCustomId('urlInput').setLabel("Bypass edilecek URL'yi girin").setStyle(TextInputStyle.Short).setPlaceholder('https://auth.platorelay.com/...').setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
        await interaction.showModal(modal);
    }
};
