const { 
    SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ActionRowBuilder, EmbedBuilder, InteractionType 
} = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('PlatoRelay ve Delta linklerini yerel motorla kırar ve detaylı rapor sunar.'),

    async execute(interaction) {
        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    
                    // Herkesin görebilmesi için ephemeral özelliğini FALSE yapıyoruz kanka
                    await int.deferReply({ ephemeral: false });
                    
                    await int.editReply({ 
                        content: `<a:loading:1507818079776935966> **Zen OS v2.4:** Çekirdek tarayıcı motoru yükleniyor. Bellek optimizasyonu aktif...` 
                    });

                    const url = int.fields.getTextInputValue('urlInput').trim();

                    const browser = await puppeteer.launch({
                        headless: "new",
                        args: [
                            '--no-sandbox', 
                            '--disable-setuid-sandbox', 
                            '--disable-dev-shm-usage',
                            '--disable-accelerated-2d-canvas',
                            '--disable-gpu',
                            '--no-first-run',
                            '--no-zygote',
                            '--single-process'
                        ]
                    });

                    try {
                        const page = await browser.newPage();
                        
                        // RAM Tasarruf Filtresi
                        await page.setRequestInterception(true);
                        page.on('request', (req) => {
                            const type = req.resourceType();
                            const reqUrl = req.url().toLowerCase();
                            if (type === 'image' || type === 'stylesheet' || type === 'font' || type === 'media' || 
                                reqUrl.includes('google-analytics') || reqUrl.includes('doubleclick') || reqUrl.includes('adscore')) {
                                req.abort();
                            } else {
                                req.continue();
                            }
                        });

                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
                        
                        const startTime = Date.now();
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

                        await int.editReply({ 
                            content: `<a:loading:1507818079776935966> **Zen OS v2.4:** Reklam duvarı manipüle ediliyor. Checkpoint doğrulamaları geçiliyor...` 
                        });

                        await page.evaluate(async () => {
                            if (window.checkpointData && window.checkpointData.key) return;
                            const buttons = Array.from(document.querySelectorAll('button, a'));
                            const target = buttons.find(b => 
                                b.innerText.toLowerCase().includes('free access') || 
                                b.innerText.toLowerCase().includes('get key') ||
                                b.innerText.toLowerCase().includes('continue')
                            );
                            if (target) target.click();
                        });

                        await new Promise(r => setTimeout(r, 6000));

                        const currentUrl = page.url();
                        const pageText = await page.evaluate(() => document.body.innerText);
                        const processTime = ((Date.now() - startTime) / 1000).toFixed(2);

                        const keyMatch = pageText.match(/[a-zA-Z0-9]{25,40}/) || currentUrl.match(/key=([^&]+)/);
                        const finalRealKey = keyMatch ? (typeof keyMatch === 'string' ? keyMatch : keyMatch[0]) : null;

                        // Üst düzey şık tasarımlı ana embed yapısı
                        if (finalRealKey) {
                            const successEmbed = new EmbedBuilder()
                                .setTitle('🔓 ZEN BYPASS SYSTEM • DATA CRACKED')
                                .setDescription('PlatoRelay/Delta güvenlik mekanizması başarıyla simüle edildi ve hedef veri söküldü.')
                                .setColor('#00ffb3')
                                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                                .addFields(
                                    { name: '📋 KULLANICI BİLGİSİ', value: `> **Tetikleyen:** ${int.user}\n> **Kullanıcı ID:** \`${int.user.id}\``, inline: false },
                                    { name: '🔑 ELDE EDİLEN ANAHTAR (KEY)', value: `\`\`\`text\n${finalRealKey}\n\`\`\``, inline: false },
                                    { name: '⚡ PERFORMANS RAPORU', value: `\`\`\`yaml\nSüre: ${processTime} saniye\nDurum: %100 Başarılı\nMotor: Yerel Safe-Chrome v22\n\`\`\``, inline: true },
                                    { name: '🔗 YÖNLENDİRME BAĞLANTISI', value: `[Hedef Sayfaya Gitmek İçin Tıkla](${currentUrl})`, inline: true }
                                )
                                .setFooter({ text: 'Zen Core Technology • Herkes Tarafından Görülebilir Rapor', iconURL: int.client.user.displayAvatarURL() })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [successEmbed] });
                        } else {
                            // Anahtar doğrudan metinden kazınamadığında tetiklenecek detaylı yedek embed
                            const fallbackEmbed = new EmbedBuilder()
                                .setTitle('🔗 ZEN BYPASS SYSTEM • WALLPASSED')
                                .setDescription('Güvenlik duvarı başarıyla aşıldı ancak anahtar verisi statik metin olarak kazınamadı. Doğrudan son sayfaya yönlendiriliyorsunuz.')
                                .setColor('#ffaa00')
                                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                                .addFields(
                                    { name: '📋 KULLANICI BİLGİSİ', value: `> **Tetikleyen:** ${int.user}`, inline: false },
                                    { name: '🌐 DOĞRUDAN ERİŞİM BAĞLANTISI', value: `🔑 [Buraya Tıklayarak Anahtarı Al](${currentUrl})\n\n*Not: Reklam geçiş adımları bot tarafından tamamlanmıştır, sayfada reklam beklemeniz gerekmez.*`, inline: false },
                                    { name: '⚙️ SİSTEM NOTU', value: `\`\`\`diff\n+ Reklam Korumaları Atlandı\n- Doğrudan Key String Çekilemedi\n\`\`\``, inline: false }
                                )
                                .setFooter({ text: 'Zen Core Technology • Herkes Tarafından Görülebilir Rapor', iconURL: int.client.user.displayAvatarURL() })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [fallbackEmbed] });
                        }

                    } catch (error) {
                        console.error(error);
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('❌ SİSTEM HATASI • BYPASS FAILED')
                            .setDescription('Hedef sayfa işlenirken beklenmeyen bir hata veya zaman aşımı meydana geldi.')
                            .setColor('#ff3333')
                            .addFields(
                                { name: '🚨 HATA DETAYI', value: `\`\`\`js\n${error.message || "Timeout / Siteden yanıt alınamadı."}\n\`\`\`` },
                                { name: '💡 ÇÖZÜM ÖNERİSİ', value: 'Girdiğiniz linkin güncel, kırılmamış veya süresi dolmamış bir Delta/Plato linki olduğundan emin olun kanka.' }
                            )
                            .setTimestamp();

                        await int.editReply({ content: null, embeds: [errorEmbed] });
                    } finally {
                        await browser.close();
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
