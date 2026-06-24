const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "gpt",
    aliases: ["ai", "chatgpt"],
    description: "Kuuliza maswali na kupata majibu kutoka kwa ChatGPT",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!text) {
            return await sock.sendMessage(from, { 
                text: `?? *Kiongozi, weka swali lako baada ya amri.*\n\nMfano: \`${config.prefix}gpt nieleze maana ya Sound Engineering\`` 
            }, { quoted: mek });
        }

        // Tuma ujumbe wa "Inafikiria..." ili mtumiaji asione bot imeganda
        await sock.sendMessage(from, { text: "?? _MACHA-AI inatafakari ujumbe wako, subiri kidogo..._" }, { quoted: mek });

        try {
            // Hapa tunatumia API yenye nguvu kuwasiliana na ChatGPT mtandaoni
            // Kama una Key yako rasmi ya OpenAI, unaweza kubadilisha muundo huu kwenda kwenye endpoint rasmi ya OpenAI
            const response = await axios.get(`https://api.lolhuman.xyz/api/openai?apikey=FREE&text=${encodeURIComponent(text)}`);
            
            let replyText = response.data.result;

            if (!replyText) {
                // Njia mbadala (Fallback API) kama ya kwanza ikizingua
                const backupRes = await axios.get(`https://aivando.net/api/gpt4?prompt=${encodeURIComponent(text)}`);
                replyText = backupRes.data.reply;
            }

            const finalResponse = `?? *MACHA-AI CHATGPT ENGINE*\n\n${replyText}\n\n*Brand:* ${config.authorName}`;

            await sock.sendMessage(from, { text: finalResponse }, { quoted: mek });

        } catch (error) {
            console.error("GPT Command Error:", error.message);
            await sock.sendMessage(from, { 
                text: "? *Samahani kiongozi!* Seva imeshindwa kuwasiliana na ChatGPT kwa sasa. Jaribu tena baada ya muda kidogo au wasiliana na @djmacha255." 
            }, { quoted: mek });
        }
    }
};