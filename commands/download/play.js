const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "play",
    aliases: ["song", "mp3"],
    description: "Kutafuta na kupakua nyimbo za MP3 kutoka YouTube",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!text) {
            return await sock.sendMessage(from, { 
                text: `?? *Weka jina la wimbo kiongozi!* \n\nMfano: \`${config.prefix}play Alikiba Mahaba\`` 
            }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: `?? _MACHA-AI inatafuta "${text}" kwenye seva za YouTube..._` }, { quoted: mek });

        try {
            // Hatua ya 1: Kutafuta wimbo na kupata link pamoja na maelezo yake
            const searchUrl = `https://api.lolhuman.xyz/api/ytsearch?apikey=FREE&query=${encodeURIComponent(text)}`;
            const searchRes = await axios.get(searchUrl);
            
            if (!searchRes.data.result || searchRes.data.result.length === 0) {
                return await sock.sendMessage(from, { text: "? *Wimbo haujapatikana!* Jaribu kuandika jina la msanii vizuri." }, { quoted: mek });
            }

            const videoData = searchRes.data.result[0];
            const videoUrl = `https://www.youtube.com/watch?v=${videoData.videoId}`;
            
            // Tuma taarifa fupi ya wimbo uliopatikana
            const infoText = `?? *MACHA-AI MUSIC PLAYER*\n\n?? *Jina:* ${videoData.title}\n?? *Muda:* ${videoData.duration}\n??? *Watazamaji:* ${videoData.views}\n?? *Link:* ${videoUrl}\n\n_Inapakua audio sasa hivi, subiri kidogo..._`;
            await sock.sendMessage(from, { text: infoText }, { quoted: mek });

            // Hatua ya 2: Kupakua Audio (MP3) kwa kutumia seva ya upakuaji
            const downloadUrl = `https://api.lolhuman.xyz/api/ytaudio?apikey=FREE&url=${encodeURIComponent(videoUrl)}`;
            const dlRes = await axios.get(downloadUrl);
            const audioLink = dlRes.data.result.link;

            // Hatua ya 3: Kutuma audio yenyewe kwenye WhatsApp ya mtumiaji
            await sock.sendMessage(from, { 
                audio: { url: audioLink }, 
                mimetype: "audio/mp4", 
                ptt: false // Weka true kama unataka uende kama voice note
            }, { quoted: mek });

        } catch (error) {
            console.error("Play Command Error:", error.message);
            await sock.sendMessage(from, { 
                text: "? *Imeshindwa kukamilisha upakuaji wa wimbo.* Huenda seva ina traffic kubwa kwa sasa. Jaribu tena baadaye au wasiliana na @djmacha255." 
            }, { quoted: mek });
        }
    }
};