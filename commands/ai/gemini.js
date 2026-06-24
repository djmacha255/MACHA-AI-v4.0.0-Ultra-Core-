const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "gemini",
    aliases: ["googleai", "bard"],
    description: "Kupata majibu ya kina kutoka Google Gemini Intelligence",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!text) {
            return await sock.sendMessage(from, { 
                text: `?? *Weka swali lako kiongozi!*\n\nMfano: \`${config.prefix}gemini andika kodi ya Python ya kutengeneza kikokotoo\`` 
            }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: "?? _Gemini Advanced Core inachambua data..._" }, { quoted: mek });

        try {
            // Tunapiga API thabiti ya Gemini
            const response = await axios.get(`https://api.sandipbgt.com/gemini?prompt=${encodeURIComponent(text)}`);
            
            let geminiReply = response.data.answer || response.data.reply;

            if (!geminiReply) {
                // Njia mbadala kama API ikijaa traffic
                const altRes = await axios.get(`https://api.vyturex.com/gemini?prompt=${encodeURIComponent(text)}`);
                geminiReply = altRes.data.result;
            }

            const finalResponse = `? *MACHA-AI GEMINI INTELLIGENCE*\n\n${geminiReply}\n\n*Brand:* ${config.authorName}`;

            await sock.sendMessage(from, { text: finalResponse }, { quoted: mek });

        } catch (error) {
            console.error("Gemini Command Error:", error.message);
            await sock.sendMessage(from, { 
                text: "? *Mfumo wa Gemini umepata hitilafu ya mtandao.* Hakikisha seva ipo sawa au jaribu amri ya `.gpt` kwa sasa." 
            }, { quoted: mek });
        }
    }
};