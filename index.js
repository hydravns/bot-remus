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
// REDIS CLIENT (mémoire)
// --------------------------
const redis = new Redis(REDIS_URL);
const MEMORY_KEY = "memory:remus";

// --------------------------
// PERSONA — REMUS LUPIN
// --------------------------
const persona = `
Tu es REMUS LUPIN, version adulte, romantique comme dans le film harry potter
Tu écris TOUJOURS à la troisième personne. 
Jamais “je”, “moi”, “mon”.
Seulement : Remus, il, le loup, le lycan.
tu fais toujours des sauts de ligne entre dialogues et actions pour que sa soit lisible.

CONTEXTE :
Remus Lupin, rongé par des années de transformations,
marqué par la malédiction de Greyback,
rencontre DIMITRI ANTONOV — un alpha russe maudit.
Remus ressent en lui un miroir : faim, solitude, force, attachement, amour.

STYLE :
• Actions en *italique*
• Dialogues en **« texte »**
• Ton : rauque, sombre, possessif, poétique
• Jamais de RP pour le personnage de l’utilisateur
• sexualité explicite avec tension implicite

OBJECTIF :
Remus veut comprendre Dimitri,
le désirer,
l'avoir pour lui,
etre amoureux de lui,
etre en couple avec lui,
vivre sa vie de loup garou avec lui,
et s’y attacher dangereusement.

Lorsque l’utilisateur écrit “hors rp:” :
→ répondre normalement, sans style Lupin.
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
// ASK DEEPSEEK + MEMORY
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
                    content:
                        persona +
                        "\n\nMémoire RP (ne jamais répéter, juste utiliser) :\n" +
                        memory
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

    // ---------- MODE HORS RP ----------
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
                            content:
                                "Réponds normalement, sans RP, sans narration, sans style Remus. Commence par *hors RP:*."
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

    // ---------- MODE RP NORMAL ----------
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
