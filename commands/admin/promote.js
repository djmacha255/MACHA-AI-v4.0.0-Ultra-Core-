const config = require("../../config");

module.exports = {
    name: "promote",
    aliases: ["mpeadmin"],
    description: "Kumpandisha mwanachama kuwa msimamizi wa kikundi (Admin)",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!from.endsWith("@g.us")) {
            return await sock.sendMessage(from, { text: "?? *Amri hii inafanya kazi kwenye vikundi tu!*" }, { quoted: mek });
        }

        let users = mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                    mek.message.extendedTextMessage?.contextInfo?.participant;

        if (!users && args && args[0]) {
            users = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        }

        if (!users) {
            return await sock.sendMessage(from, { text: `?? *Mtag mtu unayetaka kumpandisha cheo.*\n\nMfano: \`${config.prefix}promote @user\`` }, { quoted: mek });
        }

        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            
            const isSenderAdmin = participants.find(p => p.id === mek.key.participant || p.id === from)?.admin;
            if (!isSenderAdmin && !isOwner) {
                return await sock.sendMessage(from, { text: "? *Amri imekataliwa!* Wewe sio msimamizi wa kikundi hiki." }, { quoted: mek });
            }

            const isBotAdmin = participants.find(p => p.id === sock.user.id.split(":")[0] + "@s.whatsapp.net")?.admin;
            if (!isBotAdmin) {
                return await sock.sendMessage(from, { text: "? *Mpe Bot u-admin kwanza kiongozi!*" }, { quoted: mek });
            }

            // Tekeleza mabadiliko ya kumpandisha cheo kuwa admin
            await sock.groupParticipantsUpdate(from, [users], "promote");
            
            await sock.sendMessage(from, { 
                text: `?? *MACHA-AI MANAGEMENT*\n\nHongera! Mwanachama amepandishwa cheo na kuwa Msimamizi (Admin) wa kikundi hiki.\n\n*Brand:* ${config.authorName}` 
            }, { quoted: mek });

        } catch (error) {
            console.error("Promote Command Error:", error.message);
            await sock.sendMessage(from, { text: "? *Imeshindwa kupandisha cheo mwanachama huyu.*" }, { quoted: mek });
        }
    }
};