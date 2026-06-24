const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "whois",
    aliases: ["domaincheck", "lookup"],
    description: "Kupata taarifa za usajili na umiliki wa tovuti yoyote (Domain WHOIS)",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!text) {
            return await sock.sendMessage(from, { 
                text: `?? *Weka jina la tovuti kiongozi!*\n\nMfano: \`${config.prefix}whois github.com\`` 
            }, { quoted: mek });
        }

        // Kusafisha link kama mtumiaji ameweka 'https://'
        let domain = text.replace(/(^\w+:|^)\/\//, "").replace("www.", "").split("/")[0];

        await sock.sendMessage(from, { text: `?? _MACHA-AI inatafuta sajili ya WHOIS kwa domain: ${domain}..._` }, { quoted: mek });

        try {
            // Kuvuta data kutoka API ya bure ya WHOIS info
            const response = await axios.get(`https://api.lolhuman.xyz/api/whois?apikey=FREE&query=${encodeURIComponent(domain)}`);
            
            // Ikiwa API inarudisha text ya moja kwa moja ya WHOIS
            let whoisData = response.data.result;

            if (!whoisData) {
                return await sock.sendMessage(from, { text: "? *Imeshindwa kupata data za WHOIS kwa tovuti hii.* Hakikisha domain imeandikwa vizuri." }, { quoted: mek });
            }

            // WHOIS huwa ni ndefu sana, tunakata mistari michache ya juu ili isijaze chat kupitiliza
            if (whoisData.length > 2000) {
                whoisData = whoisData.substring(0, 1500) + "\n\n...[Data zimepunguzwa kwa usomaji rahisi]...";
            }

            const finalReport = `?? *MACHA-AI WHOIS DOMAIN INTEL* ??\n\n\`\`\`${whoisData}\`\`\`\n\n*Brand:* ${config.authorName}`;

            await sock.sendMessage(from, { text: finalReport }, { quoted: mek });

        } catch (error) {
            console.error("Whois Command Error:", error.message);
            await sock.sendMessage(from, { text: "? *Hitilafu imetokea.* Imeshindwa kuwasiliana na hifadhidata ya WHOIS kwa sasa." }, { quoted: mek });
        }
    }
};