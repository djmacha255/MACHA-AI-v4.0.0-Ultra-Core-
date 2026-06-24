const config = require("../../config");

module.exports = {
    name: "bc",
    aliases: ["broadcast", "tangazo"],
    description: "Kutuma ujumbe wa tangazo kwenye vikundi vyote ambavyo bot imo",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!isOwner) {
            return await sock.sendMessage(from, { text: "? *Amri hii ni ya mmiliki wa mfumo pekee!*" }, { quoted: mek });
        }

        if (!text) {
            return await sock.sendMessage(from, { text: "?? *Andika ujumbe unaotaka uwe tangazo kiongozi wetu!*" }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: "?? _MACHA-AI inaanza kusambaza tangazo kwenye vikundi vyote. Subiri ripoti..._" }, { quoted: mek });

        try {
            // Kuvuta ma-group yote ambayo bot ipo kwa sasa hivi
            const getGroups = await sock.groupFetchAllParticipating();
            const groups = Object.entries(getGroups).slice(0).map(entry => entry[1]);
            const groupIds = groups.map(v => v.id);

            let mafanikio = 0;

            for (let id of groupIds) {
                try {
                    await sock.sendMessage(id, { 
                        text: `?? *TANGAZO KUTOKA KWA MMILIKI* ??\n\n${text}\n\n*Powered by:* @djmacha255` 
                    });
                    mafanikio++;
                    
                    // Kushusha pumzi ya seva kwa sekunde 1.5 ili kuzuia spam detection ya WhatsApp (Anti-Ban)
                    await new Promise(resolve => setTimeout(resolve, 1500));
                } catch (err) {
                    console.error(`Imeshindwa kurusha kwenye group ID: ${id}`);
                }
            }

            await sock.sendMessage(from, { 
                text: `? *Mchakato Umekamilika!*\n\n?? Tangazo limefika kwenye vikundi *${mafanikio}* kati ya *${groupIds.length}*.` 
            }, { quoted: mek });

        } catch (error) {
            console.error("Broadcast Error:", error.message);
            await sock.sendMessage(from, { text: "? *Mifumo ya urushaji matangazo imekwama kwa sasa.*" }, { quoted: mek });
        }
    }
};