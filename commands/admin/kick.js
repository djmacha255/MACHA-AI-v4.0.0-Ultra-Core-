const config = require("../../config");

module.exports = {
    name: "kick",
    aliases: ["ondoa", "remove"],
    description: "Kumfukuza mwanachama aliefanya fujo kwenye kikundi",
    async execute(sock, mek, from, args, text, isOwner) {
        // 1. Hakikisha amri inatumiwa kwenye Group tu
        if (!from.endsWith("@g.us")) {
            return await sock.sendMessage(from, { text: "?? *Kiongozi, amri hii inafanya kazi kwenye vikundi (Groups) tu!*" }, { quoted: mek });
        }

        // 2. Pata namba ya mtu anayetakiwa kufukuzwa (iwe kwa kumtag au ku-reply ujumbe wake)
        let users = mek.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                    mek.message.extendedTextMessage?.contextInfo?.participant;

        if (!users && args && args[0]) {
            // Kama ameandika namba moja kwa moja bila `@`
            users = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        }

        if (!users) {
            return await sock.sendMessage(from, { 
                text: `?? *Tafadhali mtag mtu au reply ujumbe wake kiongozi!*\n\nMfano: \`${config.prefix}kick @user\`` 
            }, { quoted: mek });
        }

        try {
            // 3. Kuchukua taarifa za Group ili kujua ma-admin
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            
            // Angalia kama aliyetuma amri ni Admin au Owner
            const isSenderAdmin = participants.find(p => p.id === mek.key.participant || p.id === from)?.admin;
            if (!isSenderAdmin && !isOwner) {
                return await sock.sendMessage(from, { text: "? *Amri imekataliwa!* Huu ni uwezo wa ma-admin wa kikundi tu." }, { quoted: mek });
            }

            // Angalia kama Bot yenyewe ni Admin ili iweze kufanya oparesheni
            const isBotAdmin = participants.find(p => p.id === sock.user.id.split(":")[0] + "@s.whatsapp.net")?.admin;
            if (!isBotAdmin) {
                return await sock.sendMessage(from, { text: "? *Imeshindwa!* Tafadhali mpe Bot u-admin (Promote) kwanza ili iweze kutekeleza amri hii." }, { quoted: mek });
            }

            // 4. Tekeleza adhabu ya kumfukuza mhusika
            await sock.groupParticipantsUpdate(from, [users], "remove");
            
            await sock.sendMessage(from, { 
                text: `?? *MACHA-AI GROUP SHIELD*\n\nMwanachama amefukuzwa rasmi kwenye kikundi kwa kukiuka taratibu.\n\n*Brand:* ${config.authorName}` 
            }, { quoted: mek });

        } catch (error) {
            console.error("Kick Command Error:", error.message);
            await sock.sendMessage(from, { text: "? *Hitilafu imetokea!* Imeshindwa kumfukuza mwanachama huyo kwa sasa." }, { quoted: mek });
        }
    }
};