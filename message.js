// message.js - Umethibitishwa na @djmacha255
const { getContentType } = require("@whiskeysockets/baileys");

module.exports = async (client, m) => {
    try {
        if (!m.message) return;
        
        // 1. Tambua aina ya ujumbe (Message Type)
        m.mtype = getContentType(m.message);
        
        // Kuzuia isisome jumbe za status/stories
        if (m.key && m.key.remoteJid === "status@broadcast") return;
        
        // 2. Rahisisha viambishi muhimu (m.chat, m.sender, m.isGroup)
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith("@g.us");
        m.sender = m.fromMe ? (client.user.id.split(":")[0] + "@s.whatsapp.net") : (m.key.participant || m.key.remoteJid);
        m.pushName = m.pushName || "Mtumiaji";

        // 3. Toa maandishi halisi ya ujumbe (Body/Text Extraction)
        let body = "";
        if (m.mtype === "conversation") {
            body = m.message.conversation;
        } else if (m.mtype === "extendedTextMessage") {
            body = m.message.extendedTextMessage.text;
        } else if (m.mtype === "imageMessage") {
            body = m.message.imageMessage.caption;
        } else if (m.mtype === "videoMessage") {
            body = m.message.videoMessage.caption;
        }

        // Logic maalum ya Anti-Edit (Kupokea ujumbe uliorekebishwa)
        if (m.mtype === 'protocolMessage' && m.message.protocolMessage?.type === 14) {
            body = ""; // Wacha iendelee kwenye event yenyewe kama ulivyoweka index au index itajitegemea
        }

        // 4. Tengeneza function rahisi ya m.reply ili commands zisilete error
        m.reply = async (text) => {
            return await client.sendMessage(m.chat, { text: text }, { quoted: m });
        };

        // 5. Kuchambua Prefix na Amri (Prefix and Command Parser)
        const prefix = "."; // Alama ya kuanzia amri (Mfano: .apk au .vote)
        const isCmd = body.startsWith(prefix);
        if (!isCmd) return; // Kama mtu hajaanza na nukta, bot ipotezee ujumbe wake

        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const text = args.join(" ");

        // 6. Angalia kama amri ipo kwenye RAM (global.commands)
        const command = global.commands.get(commandName);
        if (!command) return; // Kama amri haipo, isifanye kitu yoyote

        // 7. Angalia kama mtumiaji ni Admin (kwa ajili ya amri za ma-admin kama antiedit)
        let isAdmin = false;
        if (m.isGroup) {
            try {
                const groupMetadata = await client.groupMetadata(m.chat);
                const participants = groupMetadata.participants;
                const groupAdmins = participants.filter(v => v.admin !== null).map(v => v.id);
                isAdmin = groupAdmins.includes(m.sender);
            } catch (e) {
                isAdmin = false;
            }
        }

        // 8. Tekeleza amri husika (Run Command)
        console.log(`📊 [COMMAND RUNNING] ${m.pushName} ametumia: ${prefix}${commandName}`);
        await command.execute(m, { client, text, args, isGroup: m.isGroup, isAdmin });

    } catch (err) {
        console.error("Hitilafu kwenye message handler:", err);
    }
};
