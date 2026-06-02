const { SlashCommandBuilder, IntegrationType, InteractionContext } = require('discord.js');

// Kullanıcıların notlarını geçici olarak tutacak bellek havuzu
// (Bot kapandığında sıfırlanır, kalıcı olması için MongoDB veya Quick.db bağlanabilir)
const notVeritabi = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('not')
        .setDescription('Kişisel asistanınız: Notlarınızı her yerde güvenle yönetin.')
        
        // KULLANICI UYGULAMASI AYARLARI
        .setIntegrationTypes([IntegrationType.UserInstall]) 
        .setContexts([IntegrationContext.Guild, IntegrationContext.BotDM, IntegrationContext.PrivateChannel])
        
        // 1. ÖZELLİK: Not Ekleme Alt Komutu
        .addSubcommand(sub => sub
            .setName('ekle')
            .setDescription('Profilinize yeni bir özel not kaydeder.')
            .addStringOption(o => o.setName('icerik').setDescription('Not alacağınız metin').setRequired(true)))
            
        // 2. ÖZELLİK: Not Listeleme Alt Komutu
        .addSubcommand(sub => sub
            .setName('listele')
            .setDescription('Sadece sizin görebileceğiniz şekilde tüm notlarınızı listeler.'))
            
        // 3. ÖZELLİK: Notları Temizleme Alt Komutu
        .addSubcommand(sub => sub
            .setName('temizle')
            .setDescription('Profilinizdeki tüm notları kalıcı olarak siler.')),

    async execute(interaction) {
        // Yanıtı gizli (ephemeral) yaparak sadece komutu yazanın görmesini sağlıyoruz
        await interaction.deferReply({ ephemeral: true });

        const altKomut = interaction.options.getSubcommand();
        const userId = interaction.user.id;

        // Kullanıcının veritabanında yeri yoksa boş bir liste tanımla
        if (!notVeritabi.has(userId)) {
            notVeritabi.set(userId, []);
        }
        const kullaniciNotlari = notVeritabi.get(userId);

        // ==================== NOT EKLEME MODULÜ ====================
        if (altKomut === 'ekle') {
            const icerik = interaction.options.getString('icerik');
            
            // Kota Sınırı: Belleğin şişmesini önlemek için maksimum 5 not sınırı
            if (kullaniciNotlari.length >= 5) {
                return interaction.editReply({ 
                    content: '❌ **Kota Doldu:** En fazla 5 adet not saklayabilirsiniz. Lütfen yenisini eklemek için bazılarını silin.' 
                });
            }

            // Notu zaman damgasıyla birlikte ekle
            const yeniNot = {
                metin: icerik,
                tarih: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };
            
            kullaniciNotlari.push(yeniNot);
            return interaction.editReply({ 
                content: `✅ **Not Kaydedildi:** "${icerik}" (Saat: ${yeniNot.tarih})\nBu nota istediğiniz sunucudan \`/not listele\` yazarak ulaşabilirsiniz.` 
            });
        }

        // ==================== NOT LİSTELEME MODULÜ ====================
        if (altKomut === 'listele') {
            if (kullaniciNotlari.length === 0) {
                return interaction.editReply({ content: '📭 **Profilinizde kayıtlı not bulunmuyor.** \`/not ekle\` ile ilk notunuzu yazın!' });
            }

            // Notları şık bir liste haline getir
            const notListesi = kullaniciNotlari.map((n, index) => `**${index + 1}.** [${n.tarih}] ➜ ${n.metin}`).join('\n');
            
            return interaction.editReply({ 
                content: `📝 **Kişisel Not Defteriniz (Toplam: ${kullaniciNotlari.length}/5):**\n\n${notListesi}\n\n*Bu liste tamamen size özeldir, diğer kullanıcılar göremez.*` 
            });
        }

        // ==================== NOT TEMİZLEME MODULÜ ====================
        if (altKomut === 'temizle') {
            if (kullaniciNotlari.length === 0) {
                return interaction.editReply({ content: '⚠️ Temizlenecek herhangi bir not bulunamadı.' });
            }

            notVeritabi.set(userId, []); // Kullanıcının dizisini sıfırla
            return interaction.editReply({ content: '🧹 **Başarılı:** Profilinize ait tüm notlar temizlendi.' });
        }
    }
};
