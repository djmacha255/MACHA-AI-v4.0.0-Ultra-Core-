const config = require("../../config");

module.exports = {
    name: "mode",
    description: "Kubadilisha mfumo wa bot kati ya kutumiwa na watu wote au mmiliki pekee",
    async execute(sock, mek, from, args, text, isOwner) {
        // Hakikisha anayeamuru ni mmiliki pekee
        if (!isOwner) {
            return await sock.sendMessage(from, { text: "? *Amri imekataliwa!* Hii ni siri ya mmiliki pekee." }, { quoted: mek });
        }

        if (!args[0]) {
            return await sock.sendMessage(from, { 
                text: `?? *Weka mfumo unaotaka kiongozi.*\n\nMfano:\n\`${config.prefix}mode public\` (Watu wote watumie)\n\`${config.prefix}mode private\` (Ushike wewe tu)` 
            }, { quoted: mek });
        }

        const mfumo = args[0].toLowerCase();

        if (mfumo === "public" || mfumo === "wote") {
            config.publicMode = "true"; // Inabadilisha kwenye kumbukumbu ya RAM ya seva
            await sock.sendMessage(from, { text: "?? *MACHA-AI Ultra-Core sasa ipo PUBLIC MODE!* Vikundi na watu wote wanaweza kuitumia amri zilizopo rasmi." }, { quoted: mek });
        } else if (mfumo === "private" || mfumo === "binafsi") {
            config.publicMode = "false";
            await sock.sendMessage(from, { text: "?? *MACHA-AI Ultra-Core sasa ipo PRIVATE MODE!* Mifumo imefungwa, ni wewe tu DJ MACHA 255 unayeweza kuamuru." }, { quoted: mek });
        } else {
            await sock.sendMessage(from, { text: "?? *Chagua 'public' au 'private' pekee kiongozi wetu!*" }, { quoted: mek });
        }
    }
};