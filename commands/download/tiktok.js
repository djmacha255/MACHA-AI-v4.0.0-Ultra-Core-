const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "tiktok",
    aliases: ["tt", "ttdl"],
    description: "Kupakua video za TikTok bila Watermark",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!text || !text.includes("tiktok.com")) {
            return await sock.sendMessage(from, { 
                text: `?? *Tafadhali weka link halali ya TikTok kiongozi!*\n\nMfano: \`${config.prefix}tiktok https://vm.tiktok.com/ZM.../\`` 
            }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: "?? _MACHA-AI inafuta watermark na kuivuta video kutoka TikTok, subiri kidogo..._" }, { quoted: mek });

        try {
            // Kupiga API maalum ya upakuaji wa TikTok bila watermark
            const apiUrl = `https://api.lolhuman.xyz/api/tiktok?apikey=FREE&url=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl);
            
            if (!response.data.result) {
                return await sock.sendMessage(from, { text: "? *Imeshindwa kupata video hiyo.* Hakikisha link ni sahihi na akaunti ya mtu huyo sio ya siri (private)." }, { quoted: mek });
            }

            const videoLink = response.data.result.link; // Video isiyo na watermark
            const caption = response.data.result.title || "Hiyo hapo video yako kiongozi!";

            // Kutuma video kwenye WhatsApp
            await sock.sendMessage(from, { 
                video: { url: videoLink }, 
                caption: `?? *MACHA-AI TIKTOK DL*\n\n?? *Maelezo:* ${caption}\n\n*Brand:* ${config.authorName}` 
            }, { quoted: mek });

        } catch (error) {
            console.error("TikTok Command Error:", error.message);
            await sock.sendMessage(from, { 
                text: "? *Mifumo imeshindwa kupakua video hiyo ya TikTok.* Jaribu tena baada ya sekunde chache." 
            }, { quoted: mek });
        }
    }
};