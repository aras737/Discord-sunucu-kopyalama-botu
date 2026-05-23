const { 
    SlashCommandBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    EmbedBuilder,
    InteractionType
} = require('discord.js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Bekleme sürelerini hafızada tutmak için Map
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bypass')
        .setDescription('Delta ve PlatoRelay linklerini geçerek keyi getirir.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const now = Date.now();
        const cooldownAmount = 30 * 1000; // Hızlı test için cooldown süresini 30 saniyeye çektim kanka

        // 1. COOLDOWN KONTROLÜ
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return interaction.reply({ 
                    content: `❌ | Please wait ${timeLeft.toFixed(1)} more second(s) before using the bypass command.`, 
                    ephemeral: true 
                });
            }
        }

        // Dinleyiciyi (Listener) sadece bir kez kuruyoruz ki her basışta tetiklenip "Bilinmeyen Etkileşim" vermesin
        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    // KANKA BURASI HAYATİ: Discord'a "işlem uzun sürecek, bekle" diyoruz
                    await int.deferReply({ ephemeral: true });

                    const url = int.fields.getTextInputValue('urlInput').trim();

                    // Tarayıcıyı arka planda başlatıyoruz
                    const browser = await puppeteer.launch({
                        headless: "new",
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                    });

                    try {
                        const page = await browser.newPage();
                        // Delta/PlatoRelay'in bot korumasını delmek için güncel Chrome User-Agent'ı
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

                        // Sayfaya git ve ağ trafiği sakinleşene kadar bekle
                        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

                        // Delta ve Plato sayfalarındaki yönlendirme butonlarını taklit edip tetikliyoruz
                        await page.evaluate(async () => {
                            const delay = ms => new Promise(res => setTimeout(res, ms));
                            const buttons = Array.from(document.querySelectorAll('button, a'));
                            
                            // Delta / LootLabs geçişlerinde sık kullanılan tetikleyiciler
                            const targetBtn = buttons.find(b => 
                                b.innerText.toLowerCase().includes('free access') || 
                                b.innerText.toLowerCase().includes('get key') ||
                                b.innerText.toLowerCase().includes('continue')
                            );
                            
                            if (targetBtn) {
                                targetBtn.click();
                            }
                        });

                        // Reklam sisteminin ve checkpoint'lerin aşılması için 8 saniye zorunlu bekleme
                        await new Promise(r => setTimeout(r, 8000));

                        // Sayfanın ulaştığı son URL ve metin içeriği
                        const currentUrl = page.url();
                        const pageText = await page.evaluate(() => document.body.innerText);

                        // Delta keyleri genelde uzun harf/rakam kombinasyonları olur, Regex ile tarıyoruz
                        const keyMatch = pageText.match(/[a-zA-Z0-9]{15,45}/);
                        const finalKey = keyMatch ? keyMatch[0] : null;

                        const embed = new EmbedBuilder()
                            .setTitle('🔓 Zen Bypass: Delta Cracked!')
                            .setColor('#00ffcc')
                            .setThumbnail('https://i.imgur.com/wSTFkRM.png') // Delta tarzı bir imaj istersen değiştirebilirsin
                            .addFields(
                                { name: '🔑 Alınan Key / Sonuç', value: `\`\`\`${finalKey || "Anahtar metinde doğrudan bulunamadı ama sayfa geçildi."}\`\`\`` },
                                { name: '🔗 Yönlendirilen URL', value: `[Hedef Sayfaya Git](${currentUrl})` }
                            )
                            .setFooter({ text: 'Delta Engine Bypass System' })
                            .setTimestamp();

                        await int.editReply({ embeds: [embed] });

                    } catch (error) {
                        console.error("Bypass İşlem Hatası:", error);
                        await int.editReply({ content: '❌ **Bypass Başarısız:** Delta koruması aşılamadı veya Render RAM sınırına takıldı kanka.' });
                    } finally {
                        await browser.close();
                    }
                }
            });
            interaction.client.bypassListenerSet = true;
        }

        // Cooldown'ı aktif et
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        // 2. MODAL (FORM) OLUŞTURMA VE GÖSTERME
        const modal = new ModalBuilder()
            .setCustomId('bypassModal')
            .setTitle('Zen Bypass');

        const urlInput = new TextInputBuilder()
            .setCustomId('urlInput')
            .setLabel("Bypass edilecek URL'yi girin")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://auth.platorelay.com/...')
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(urlInput);
        modal.addComponents(firstActionRow);

        // Formu kullanıcıya fırlatıyoruz
        await interaction.showModal(modal);
    },
};
