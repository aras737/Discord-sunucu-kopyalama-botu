import discord
from discord import app_commands
import asyncio
import aiohttp # Ham API isteği için şart

# Sadece senin ID'n
OWNER_ID = 1389930042200559706

class PhantomCommand(app_commands.Command):
    def __init__(self):
        super().__init__(
            name="phantom",
            description="Phantom Mode: Sistem filtresini bypass ederek kanalı duman eder.",
            callback=self.phantom_callback
        )

@app_commands.allowed_installs(guilds=True, users=True)
@app_commands.allowed_contexts(guilds=True, dms=True, private_channels=True)
async def phantom_callback(interaction: discord.Interaction, mesaj: str, miktar: int = 15):
    if interaction.user.id != OWNER_ID:
        return

    # --- PHANTOM ADIM 1: SİS BOMBASI ---
    # Discord bizi 'uslu' sansın diye ephemeral (gizli) başlıyoruz.
    await interaction.response.send_message("🌑 **Phantom Mode Activated.**", ephemeral=True)

    # --- PHANTOM ADIM 2: İZLERİ SİL ---
    # Görseldeki "Orijinal mesaj silinmiş" yazısı buradan gelir.
    await interaction.delete_original_response()

    # --- PHANTOM ADIM 3: RAW API BOMBARDIMANI ---
    # discord.py'ın kısıtlamalarını aşmak için doğrudan URL'ye POST atıyoruz.
    application_id = interaction.application_id
    token = interaction.token
    url = f"https://discord.com/api/v10/webhooks/{application_id}/{token}"

    async with aiohttp.ClientSession() as session:
        for i in range(miktar):
            try:
                # Dinamik gecikme (Spam filtresini şaşırtmak için)
                delay = 0.6 + (i * 0.05) 
                await asyncio.sleep(delay)

                # HAM VERİ: flags: 0 (Zorla Public/Herkese Açık)
                payload = {
                    "content": mesaj,
                    "flags": 0, # İŞTE BYPASS BURASI
                    "allowed_mentions": {"parse": ["users", "roles", "everyone"]}
                }

                async with session.post(url, json=payload) as resp:
                    if resp.status == 429: # Rate Limit (Hız Sınırı)
                        retry_after = (await resp.json()).get('retry_after', 2)
                        await asyncio.sleep(retry_after)
                    elif resp.status != 204 and resp.status != 200:
                        # Eğer Discord yolu tamamen kapattıysa dur
                        break
            except Exception as e:
                print(f"Phantom hatası: {e}")
                break

# Not: Bu fonksiyonu botunun tree'sine eklemen lazım (tree.add_command)
