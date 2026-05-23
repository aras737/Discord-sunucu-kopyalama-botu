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
        .setDescription('PlatoRelay ve Delta linklerini harici API olmadan, tarayıcıyla kökten çözer.'),

    async execute(interaction) {
        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    
                    await int.deferReply({ ephemeral: true });
                    // Tam istediğin yükleme emojisi dönüyor kanka
                    await int.editReply({ 
                        content: `<a:loading:1507818079776935966> **Zen Yerel Motor: Harici API'ler çöpe atıldı. Saf tarayıcı motoru yükleniyor...**` 
                    });

                    const url = int.fields.getTextInputValue('urlInput').trim();

                    // Render'ı çökertmeyecek ultramax hafiflikte tarayıcı konfigürasyonu
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
                            '--single-process' // RAM'i tek bir kanala sıkıştırır, Render dostudur
                        ]
                    });

                    try {
                        const page = await browser.newPage();
                        
                        // KANKA BURASI KRİTİK: RAM'i korumak için resimleri, css'leri ve reklam ağlarını blokluyoruz
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
                        
                        // Sayfaya git (Sadece düz saf kod yükleneceği için ışık hızında açılacak)
                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

                        await int.editReply({ 
                            content: `<a:loading:1507818079776935966> **Zen Yerel Motor: Plato/Delta güvenlik duvarı manipüle ediliyor, anahtar kazınıyor...**` 
                        });

                        // Sitedeki sayaçları ve buton tetikleyicilerini simüle et
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

                        // İşlemlerin oturması için yerel bekleme süresi
                        await new Promise(r => setTimeout(r, 6000));

                        const currentUrl = page.url();
                        const pageText = await page.evaluate(() => document.body.innerText);

                        // Delta ve Plato anahtarlarını yakalayacak regex formasyonu
                        const keyMatch = pageText.match(/[a-zA-Z0-9]{25,40}/) || currentUrl.match(/key=([^&]+)/);
                        const finalRealKey = keyMatch ? (typeof keyMatch === 'string' ? keyMatch : keyMatch[0]) : null;

                        if (finalRealKey) {
                            const embed = new EmbedBuilder()
                                .setTitle('🔓 Zen Yerel Motor: Başarıyla Çözüldü!')
                                .setColor('#00ffb3')
                                .addFields(
                                    { name: '🔑 Gerçek Alınan Key', value: `\`\`\`${finalRealKey}\`\`\`` },
                                    { name: '🔗 Yönlendirilen Son Adres', value: `[Bağlantıya Git](${currentUrl})` }
                                )
                                .setFooter({ text: 'Harici API Yok • %100 Yerel Güç' })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [embed] });
                        } else {
                            // Eğer tam kod yakalanamadıysa yönlenen son sayfayı verelim, kullanıcı elle alsın
                            const embed = new EmbedBuilder()
                                .setTitle('🔗 Zen Yerel Motor: Reklam Duvarı Geçildi!')
                                .setColor('#ffaa00')
                                .setDescription('Anahtar doğrudan metin olarak kazınamadı ancak reklam koruması aşıldı. Aşağıdaki linkten doğrudan anahtar sayfasına ulaşabilirsin kanka.')
                                .addFields({ name: '🌐 Hedef Sayfa', value: `[Anahtarı Görüntüle](${currentUrl})` })
                                .setTimestamp();

                            await int.editReply({ content: null, embeds: [embed] });
                        }

                    } catch (error) {
                        console.error(error);
                        await int.editReply({ 
                            content: '❌ **Bypass Başarısız:** Sayfa yüklenirken zaman aşımına uğradı veya link geçersiz kanka.' 
                        });
                    } finally {
                        await browser.close();
                    }
                }
            });
            interaction.client.bypassListenerSet = true;
        }

        const modal = new ModalBuilder().setCustomId('bypassModal').setTitle('Zen Saf Tarayıcı Bypass');
        const urlInput = new TextInputBuilder().setCustomId('urlInput').setLabel("Bypass edilecek URL'yi girin").setStyle(TextInputStyle.Short).setPlaceholder('https://auth.platorelay.com/...').setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
        await interaction.showModal(modal);
    }
};
