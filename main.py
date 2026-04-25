import discord
from discord.ext import commands
import os
import asyncio
import json

# Railway'de Environment Variables (TOKEN) kısmından okur
TOKEN = os.getenv("TOKEN")

intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    print(f'--- ARAS CLONER V9 ---')
    print(f'Bot Aktif: {bot.user.name}')
    print(f'Railway Durumu: 7/24 Online')
    print(f'-----------------------')

@bot.command()
@commands.has_permissions(administrator=True)
async def klonla(ctx, source_id: int, target_id: int):
    source_guild = bot.get_guild(source_id)
    target_guild = bot.get_guild(target_id)

    if not source_guild or not target_guild:
        return await ctx.send("❌ **Hata:** Sunucular bulunamadı. Botun her iki sunucuda da yönetici olduğundan emin ol!")

    embed = discord.Embed(
        title="♻️ Klonlama İşlemi Başladı",
        description=f"**Kaynak:** {source_guild.name}\n**Hedef:** {target_guild.name}\n\n*İşlem sırasında kanallar silinecek ve roller yeniden oluşturulacaktır.*",
        color=0x7289da
    )
    await ctx.send(embed=embed)

    # 1. HEDEFTİ HER ŞEYİ SİL (Görseldeki gibi temizlik)
    for channel in target_guild.channels:
        try: await channel.delete()
        except: continue
    
    for role in target_guild.roles:
        if role.name != "@everyone" and not role.managed:
            try: await role.delete()
            except: continue

    # 2. ROLLERİ VE İZİNLERİ KOPYALA
    role_map = {}
    for role in reversed(source_guild.roles):
        if role.name != "@everyone" and not role.managed:
            new_role = await target_guild.create_role(
                name=role.name, permissions=role.permissions,
                color=role.color, hoist=role.hoist, mentionable=role.mentionable
            )
            role_map[role] = new_role
            await asyncio.sleep(0.4) # Rate limit koruması

    # 3. KATEGORİ VE KANALLARI KOPYALA (JSON MANTIĞI)
    for category in source_guild.categories:
        new_cat = await target_guild.create_category(name=category.name)
        for channel in category.channels:
            # İzin senkronizasyonu
            overwrites = {}
            for role, perm in channel.overwrites.items():
                if role in role_map:
                    overwrites[role_map[role]] = perm

            if isinstance(channel, discord.TextChannel):
                await new_cat.create_text_channel(name=channel.name, topic=channel.topic, nsfw=channel.nsfw, overwrites=overwrites)
            elif isinstance(channel, discord.VoiceChannel):
                await new_cat.create_voice_channel(name=channel.name, user_limit=channel.user_limit, overwrites=overwrites)
            await asyncio.sleep(0.6)

    await ctx.send(f"✅ **Klonlama Tamamlandı!** Sunucu başarıyla aynalandı.")

bot.run(TOKEN)
