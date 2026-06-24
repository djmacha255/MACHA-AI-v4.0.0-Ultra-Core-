// vote.js - Umethibitishwa na @djmacha255

module.exports = {
    name: "vote",
    category: "group",
    desc: "Kuanzisha kura (Poll) ya kuchagua kitu ndani ya kundi.",
    async execute(m, { client, text, isGroup }) {
        // Hakikisha inatumika kwenye group tu
        if (!isGroup) return m.reply("⚠️ Amri hii inafanya kazi kwenye makundi (Groups) tu!");

        // Angalia kama mtumiaji ameweka mada na machaguo kwa kutumia alama ya |
        if (!text || !text.includes("|")) {
            return m.reply(
                "⚠️ *Muundo Sio Sahihi!*\n\n" +
                "Tafadhali tumia alama ya *|* kutenganisha swali na machaguo yako.\n\n" +
                "📝 *Mfano wa Matumizi:*\n" +
                "*.vote Nani DJ mkali Moshi? | DJ MACHA 255 | Mwingine* \n\n" +
                " Waweza kuweka machaguo mengi zaidi kwa kuongeza alama ya *|*"
            );
        }

        // Tenganisha swali na machaguo kwa kutumia alama ya "|"
        let parts = text.split("|").map(item => item.trim());
        let question = parts[0]; // Sehemu ya kwanza ndio swali/mada
        let options = parts.slice(1); // Sehemu zinazofuata ni machaguo

        // WhatsApp inahitaji angalau machaguo mawili ili kuunda kura
        if (options.length < 2) {
            return m.reply("❌ Tafadhali weka angalau machaguo mawili (2) ili kura ikamilike.");
        }

        // WhatsApp hairuhusu machaguo zaidi ya 12 kwenye poll moja
        if (options.length > 12) {
            return m.reply("❌ Umepitiliza kikomo! WhatsApp inaruhusu mwisho machaguo 12 tu.");
        }

        try {
            // Mfumo rasmi wa Baileys kutuma WhatsApp Poll
            await client.sendMessage(m.chat, {
                poll: {
                    name: `📊 *KURA / POLL*\n\n📝 *Swali:* ${question}\n\n_Imeanzishwa na: ${m.pushName || 'Mjumbe'}_`,
                    values: options,
                    selectableCount: 1 // "1" inamaanisha mtu anaruhusiwa kupiga kura chaguo moja tu. (Weka zaidi kama unataka achague mengi)
                }
            }, { quoted: m });

        } catch (error) {
            console.error("Vote Command Error:", error);
            m.reply("❌ Hitilafu imetokea wakati wa kuandaa kura hiyo. Jaribu tena.");
        }
    }
};
