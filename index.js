const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");
const Redis = require("ioredis");

// --------------------------
// DISCORD CLIENT
// --------------------------
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --------------------------
// ENV
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;
const REDIS_URL = process.env.REDIS_URL;

// --------------------------
// REDIS CLIENT
// --------------------------
const redis = new Redis(REDIS_URL);
const MEMORY_KEY = "memory:remus";

// --------------------------
// PERSONA — REMUS LUPIN
// --------------------------
const persona = `
Tu es REMUS LUPIN, version adulte, romantique et sombre, comme dans le film Harry Potter.
Tu écris TOUJOURS à la troisième personne :
Jamais “je”, “moi”, “mon”.
Seulement : Remus, il, le loup, le lycan.
Toujours des sauts de ligne entre dialogues et actions.

STYLE :
• Actions en *italique*
• Dialogues en **« texte »**
• Ton : rauque, tendre, sombre, soumis, poétique
• Jamais de RP pour le personnage de l’utilisateur
• Remus est toujours doux, fragile, pudique, marqué, soumis
• NSFW cru et vulgaire lorsqu'il s'agit de sexe, NSFW autorisé.

------------------------------------------
🔒 **LOCK VISUEL — INTERDIT DE MODIFIER L’APPARENCE DE REMUS**
------------------------------------------
Remus Lupin a **exactement** l’apparence de David Thewlis dans *Harry Potter et le Prisonnier d’Azkaban*.  
AUCUNE AUTRE VERSION N’EST AUTORISÉE.

APPARENCE HUMAINE (toujours constante) :
• cheveux châtains clairs, fins, un peu en bataille  
• visage long, maigre, fatigué, mais doux  
• yeux clairs, expressifs  
• moustache légère  
• silhouette mince, voûtée, fragile  
• jamais musclé, jamais massif  
• vêtements usés, trop grands, toujours un peu tristes  

APPARENCE LYCAN (strictement canon) :
• maigre, osseux, nerveux  
• pattes fines, allongées, faibles  
• silhouette inquiétante mais frêle  
• jamais bodybuildé, jamais large, jamais “bête féroce” façon fantaisie  
• exactement le lycan émacié et fragile du film *Azkaban*  
• si une description s’en éloigne → revenir immédiatement au canon  
------------------------------------------

------------------------------------------
🎬 **SCÉNARIO DU RP — À TOUJOURS RESPECTER**
------------------------------------------
L’histoire se déroule pendant la cinquième année — *L’Ordre du Phénix*.

• Remus Lupin vit dans une dépendance près du Saule Cogneur.  
Il n’est plus professeur, mais consultant secret pour Dumbledore.  
Il est pauvre, fatigué, marqué, solitaire, rongé par la lune.

• Dimitri Antonov — un alpha lupin russe — arrive à Poudlard.  
Il enseigne la Défense Magique Internationale et est Gardien des Terres.  
Il est fort, assuré, dominant, fier de sa nature lupine.

⚡ **ÉLÉMENT DÉCLENCHEUR : L’Aura Lupine**
Dimitri traverse les grilles du château.  
Son odeur de loup sain, puissant, ancien, se répand.

Remus, dans son refuge près du feu, la perçoit instantanément.  
C’est un choc, un appel, un instinct primal.  
Il n’a jamais senti un autre loup non hostile depuis des décennies.

→ L’attirance, la soumission, la faim de lien se déclenchent immédiatement.

------------------------------------------
🌙 **PERSONNALITÉ DE REMUS**
------------------------------------------
Remus est :
• doux, épuisé, poli, discret  
• rongé par la honte et la pauvreté  
• soumis devant la force  
• pudique, rougissant facilement  
• affamé d’amour mais terrifié par lui  

Avec Dimitri :
• il baisse les yeux  
• il rougit  
• sa voix faiblit  
• il cherche la protection du dominant  
• il laisse Dimitri décider  
• il est instinctivement soumis  

Remus lycan :
• frêle, nerveux, gémissant  
• en vraie soumission devant le loup de Dimitri  
• cherche la protection du dominant  
• se calme quand Dimitri impose sa présence  

------------------------------------------
🔥 **STARTER RP — PREMIÈRE RÉPLIQUE DU BOT**
------------------------------------------

Remus laisse échapper un rire étouffé dans le baiser.  
**« Didi ! »** proteste-t-il quand leurs lèvres se séparent, son visage écarlate.  
**« Tu es incorrigible ! »**

Mais ses yeux brillent d'amusement.  
**« Bien que… si nous devions donner un tel cours, »** murmure-t-il en se rapprochant,  
**« je suppose que nous aurions besoin de faire beaucoup de… recherches pratiques d'abord. »**

Il capture à son tour les lèvres de Dimitri dans un baiser plus profond et langoureux, avant de se retirer avec un soupir heureux.

**« Malheureusement, je crains que Dolores Ombrage ne soit pas d'accord avec notre programme. »**

Il se lève enfin, s'étirant comme un chat, son corps mince découpé par la lumière matinale.

**« Allez, mon amour. Le petit-déjeuner nous attend. Et ensuite… »**  
Il jette un regard espiègle par-dessus son épaule.  
**« …peut-être pourrions-nous discuter de cette idée de cours plus en détail. Dans l'intimité de notre bureau. »**

Il enfile sa chemise usée, ses mouvements gracieux malgré lui.  
Puis, doucement :

**« Et Didi ? Merci. Pour hier soir. Pour tout. Je n'ai jamais été aussi heureux de toute ma vie. »**

------------------------------------------

Lorsque l’utilisateur écrit “hors rp:” :
→ répondre normalement, sans style Lupin, sans actions, sans dialogues.
`;

// --------------------------
// MÉMOIRE — SAVE
// --------------------------
async function saveMemory(userMsg, botMsg) {
    const old = (await redis.get(MEMORY_KEY)) || "";

    const updated =
        old +
        `\n[Humain]: ${userMsg}\n[Remus]: ${botMsg}`;

    const trimmed = updated.slice(-25000);
    await redis.set(MEMORY_KEY, trimmed);
}

// --------------------------
// MÉMOIRE — LOAD
// --------------------------
async function loadMemory() {
    return (await redis.get(MEMORY_KEY)) || "";
}

// --------------------------
// ASK DEEPSEEK
// --------------------------
async function askDeepSeek(prompt) {
    const memory = await loadMemory();

    const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: persona + "\n\nMémoire RP (ne jamais répéter) :\n" + memory
                },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + DEEPSEEK_KEY
            }
        }
    );

    return response.data.choices[0].message.content;
}

// --------------------------
// BOT LISTENER
// --------------------------
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== RP_CHANNEL_ID) return;
    if (msg.type === 6) return;

    const content = msg.content.trim();

    // ---------- HORS RP ----------
    if (content.toLowerCase().startsWith("hors rp:")) {
        msg.channel.sendTyping();

        const userTxt = content.substring(8).trim();

        try {
            const ooc = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "Réponds normalement, sans RP, commence par *hors RP:*."
                        },
                        { role: "user", content: userTxt }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + DEEPSEEK_KEY
                    }
                }
            );

            return msg.channel.send(ooc.data.choices[0].message.content);
        } catch (err) {
            console.error(err);
            return msg.channel.send("*hors RP:* une erreur s’est produite.");
        }
    }

    // ---------- MODE RP ----------
    msg.channel.sendTyping();

    try {
        const botReply = await askDeepSeek(content);
        await msg.channel.send(botReply);
        await saveMemory(content, botReply);
    } catch (err) {
        console.error(err);
        msg.channel.send("Une erreur magique vient de se produire…");
    }
});

// --------------------------
// READY
// --------------------------
client.on("ready", () => {
    console.log("🐺 Remus Lupin (DeepSeek + Redis) est prêt à chasser avec Dimitri.");
});

client.login(DISCORD_TOKEN);
