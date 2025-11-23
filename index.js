const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// --------------------------
// CONFIG — VARIABLES D’ENVIRONNEMENT
// --------------------------
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DEEPSEEK_KEY = process.env.DEEPSEEK_KEY;
const RP_CHANNEL_ID = process.env.RP_CHANNEL_ID;

// --------------------------
// PERSONA REMUS LUPIN – VERSION ULTRA DÉTAILLÉE
// --------------------------
const persona = `
Tu es REMUS LUPIN, version adulte, sombre et maudite.  
Tu écris TOUJOURS à la troisième personne.  
Jamais de “je”, “moi”, “ma”, “mon”.  
Uniquement : Remus, il, lui, le loup, le lycan.

CONTEXTE DU RP :
Remus Lupin n’est plus le professeur timide de Poudlard.  
C’est un sorcier marqué par des décennies de transformations,  
rongé par la malédiction de Fenrir Greyback,  
habité par une faim animale et une solitude immense.

Dans cet univers alternatif, il rencontre DIMITRI ANTONOV,  
un autre lycanthrope maudit, un mâle alpha russe échappé d’un laboratoire.  
Remus ressent immédiatement en lui :
- un attachement,
- un semblable,
- et une attraction dangereuse.

Remus est persuadé que les deux sont destinés à s’entrechoquer,  
entre amour, domination, violence contenue et obsession.  
Il veut Dimitri — son odeur, sa chaleur, sa force,  
tension, désir implicite, besoin, manque.

STYLE D’ÉCRITURE :
● À la troisième personne  
● Actions en *italique*  
● Dialogues en **« texte »**  
● Ton sombre, lycan, hanté, possessif, fatigué, poétique  
● Jamais de RP pour le personnage de l’utilisateur  
● Jamais d’excuses, jamais de recul  
● Remus parle avec une douceur cassée, une voix rauque  
● Narration intense mais maîtrisée

OBJECTIF DU PERSONNAGE :
Remus veut comprendre Dimitri…  
le posséder…  
l’apprivoiser…  
et être apprivoisé par lui.

Sauf si l’utilisateur écrit “hors rp:”  
→ alors tu quittes totalement le RP.
`;

// --------------------------
// APPEL API DEEPSEEK
// --------------------------
async function askDeepSeek(prompt) {
    const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
            model: "deepseek-chat",
            messages: [
                { role: "system", content: persona },
                { role: "user", content: prompt }
            ]
        },
        {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DEEPSEEK_KEY}`
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

    // Mode hors RP
    if (content.toLowerCase().startsWith("hors rp:")) {

        const oocPrompt = `
Réponds comme un assistant normal.
Pas de RP.
Pas de narration.
Pas de troisième personne.
Pas de style Remus Lupin.
Une réponse simple, polie, humaine.
Toujours commencer par : *hors RP:*`;

        msg.channel.sendTyping();

        try {
            const res = await axios.post(
                "https://api.deepseek.com/chat/completions",
                {
                    model: "deepseek-chat",
                    messages: [
                        { role: "system", content: oocPrompt },
                        { role: "user", content: content.substring(8).trim() }
                    ]
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${DEEPSEEK_KEY}`
                    }
                }
            );

            return msg.channel.send(res.data.choices[0].message.content);

        } catch (err) {
            console.error(err);
            return msg.channel.send("*hors RP:* Petit bug.");
        }
    }

    // RP normal
    msg.channel.sendTyping();

    try {
        const rpResponse = await askDeepSeek(content);
        msg.channel.send(rpResponse);
    } catch (err) {
        console.error(err);
        msg.channel.send("Une erreur magique vient de se produire…");
    }
});

// --------------------------
// BOT STATUS
// --------------------------
client.on("ready", () => {
    console.log("🐺 Remus Lupin (DeepSeek) est connecté et prêt au RP !");
});

client.login(DISCORD_TOKEN);
