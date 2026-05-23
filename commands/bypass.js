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
        const cooldownAmount = 30 * 1000; // 30 saniye bekleme süresi

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

        // Dinleyiciyi (Listener) sadece bir kez kuruyoruz
        if (!interaction.client.bypassListenerSet) {
            interaction.client.on('interactionCreate', async (int) => {
                if (int.type === InteractionType.ModalSubmit && int.customId === 'bypassModal') {
                    
                    // KANKA İŞTE BURASI: Butona basıldığı an senin loading emojin dönmeye başlayacak
                    await int.deferReply({ ephemeral: true });
                    await int.editReply({ 
                        content: `<a:loading:1507818079776935966> **Zen Engine: Siteye giriş yapılıyor, reklamlar manipüle ediliyor. Lütfen bekleyin...**` 
                    });

                    const url = int.fields.getTextInputValue('urlInput').trim();

                    // Tarayıcıyı arka planda gizli modda başlatıyoruz
                    const browser = await puppeteer.launch({
                        headless: "new",
                        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
                    });

                    try {
                        const page = await browser.newPage();
                        // Bot engellerini aşmak için güncel User-Agent
                        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

                        // Sayfaya git ve ağ trafiği sakinleşene kadar bekle
                        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

                        // Sayfa yüklendiğinde loading mesajını güncelleyerek durum bildiriyoruz kanka
                        await int.editReply({ 
                            content: `<a:loading:1507818079776935966> **Zen Engine: Delta/Plato duvarı geçiliyor, anahtar aranıyor...**` 
                        });

                        // Delta ve Plato sayfalarındaki yönlendirme butonlarını tetikliyoruz
                        await page.evaluate(async () => {
                            const buttons = Array.from(document.querySelectorAll('button, a'));
                            const targetBtn = buttons.find(b => 
                                b.innerText.toLowerCase().includes('free access') || 
                                b.innerText.toLowerCase().includes('get key') ||
                                b.innerText.toLowerCase().includes('continue')
                            );
                            if (targetBtn) targetBtn.click();
                        });

                        // İşlemlerin oturması için agresif bekleme süresi
                        await new Promise(r => setTimeout(r, 8000));

                        // Sonuçları topla
                        const currentUrl = page.url();
                        const pageText = await page.evaluate(() => document.body.innerText);

                        // Delta key formasyonunu regex ile yakala
                        const keyMatch = pageText.match(/[a-zA-Z0-9]{15,45}/);
                        const finalKey = keyMatch ? keyMatch[0] : null;

                        const embed = new EmbedBuilder()
                            .setTitle('🔓 Zen Bypass: Delta Cracked!')
                            .setColor('#00ffcc')
                            .addFields(
                                { name: '🔑 Alınan Key / Sonuç', value: `\`\`\`${finalKey || "Anahtar doğrudan metin olarak bulunamadı ama bypass tamam."}\`\`\`` },
                                { name: '🔗 Yönlendirilen URL', value: `[Hedef Sayfaya Git](${currentUrl})` }
                            )
                            .setFooter({ text: 'Delta Engine Bypass System' })
                            .setTimestamp();

                        // İşlem bittiğinde loading mesajını kaldırıp sadece embed'i basıyoruz!
                        await int.editReply({ content: null, embeds: [embed] });

                    } catch (error) {
                        console.error("Bypass İşlem Hatası:", error);
                        await int.editReply({ 
                            content: '❌ **Bypass Başarısız:** Delta koruması aşılamadı veya Render RAM limitine takıldı kanka.' 
                        });
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
