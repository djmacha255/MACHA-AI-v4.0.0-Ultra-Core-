const axios = require("axios");
const config = require("../../config");

module.exports = {
    name: "iplookup",
    aliases: ["ip", "ipcheck"],
    description: "Kufuatilia na kupata taarifa za kijiografia za IP Address au Domain",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!text) {
            return await sock.sendMessage(from, { 
                text: `?? *Kiongozi, weka IP Address au Domain unayotaka kuichunguza.*\n\nMfano: \`${config.prefix}iplookup 8.8.8.8\` au \`${config.prefix}iplookup google.com\`` 
            }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: "?? _MACHA-AI Cyber Core inafuatilia mawimbi ya IP hiyo, subiri kidogo..._" }, { quoted: mek });

        try {
            // Tunatumia API thabiti na ya bure ya ip-api ya mambo ya network
            const response = await axios.get(`http://ip-api.com/json/${text}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`);
            const data = response.data;

            if (data.status === "fail") {
                return await sock.sendMessage(from, { text: `? *Uchunguzi umefeli!* Sababu: ${data.message || "IP au Domain haipo halali."}` }, { quoted: mek });
            }

            const report = `?????? *MACHA-AI INTEL REPORT (IP/DOMAIN)* ??????

?? *Target IP:* ${data.query}
?? *Nchi:* ${data.country} (${data.countryCode})
??? *Mkoa/Mji:* ${data.regionName} / ${data.city}
?? *Zip Code:* ${data.zip || "N/A"}
? *Muda (Timezone):* ${data.timezone}
?? *Mtoa Huduma (ISP):* ${data.isp}
?? *Shirika (Org):* ${data.org || "N/A"}
?? *AS Number:* ${data.as}
?? *Ramani (Coordinates):* ${data.lat}, ${data.lon}

*Brand:* ${config.authorName}`;

            await sock.sendMessage(from, { text: report }, { quoted: mek });

        } catch (error) {
            console.error("IP Lookup Error:", error.message);
            await sock.sendMessage(from, { text: "? *Mifumo ya kiintelijensia imeshindwa kufikia seva ya uchunguzi.* Jaribu tena baadaye." }, { quoted: mek });
        }
    }
};