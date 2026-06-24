const config = require("../../config");

// Mfumo wa kukokotoa Uptime ya Seva kuwa masaa na dakika
function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor((seconds % (3600 * 24)) / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + "d " : "";
    var hDisplay = h > 0 ? h + "h " : "";
    var mDisplay = m > 0 ? m + "m " : "";
    var sDisplay = s > 0 ? s + "s" : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

module.exports = {
    name: "menu",
    aliases: ["help", "m"],
    description: "Inaonyesha orodha kuu ya amri za MACHA-AI",
    async execute(sock, mek, from, args, text, isOwner) {
        const uptime = runtime(process.uptime());
        
        // Tarehe ya leo kiotomatiki
        const leo = new Date().toLocaleDateString("sw-TZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

        const menuText = `?? • ?? MACHA-AI SUPER BOT • ????
?
? ?? OWNER: ${config.ownerName}
? ?? VERSION: ${config.version}
? ?? DATE: ${leo}
? ?? UPTIME: ${uptime}
? ?? YT: DJ MACHA 255
? ??? BRAND: ${config.instagramHandle}
?
??????????????????????????????

+---? ?? AUDIO SYSTEM & DJ PRODUCTION ?
¦
¦ ? ${config.prefix}bassboost <reply audio>
¦ ? ${config.prefix}slowreverb <reply audio>
¦ ? ${config.prefix}nightcore <reply audio>
¦ ? ${config.prefix}vocalremover <reply audio/video>
¦ ? ${config.prefix}compressor <reply audio>
¦ ? ${config.prefix}audiocut <start> <end>
¦ ? ${config.prefix}instrumental <reply audio>
¦ ? ${config.prefix}tempo <BPM_multiplier>
¦ ? ${config.prefix}reverse <reply audio>
¦ ? ${config.prefix}toaudio <reply video>
¦
+-------------------------??

+---? ?? BUSINESS, BOOKING & FINTECH ?
¦
¦ ? ${config.prefix}rentals (Orodha ya vifaa vya sauti)
¦ ? ${config.prefix}bookdj (Weka booking ya show)
¦ ? ${config.prefix}invoice <jina> <kiasi>
¦ ? ${config.prefix}rates / ${config.prefix}services
¦ ? ${config.prefix}mpesacheck <transaction_id>
¦
+-------------------------??

+---? ?????? CYBER, IT & OSINT SUITE ?
¦
¦ ? ${config.prefix}iplookup <IP/Domain>
¦ ? ${config.prefix}hash <md5/sha256> <text>
¦ ? ${config.prefix}hostcheck <domain>
¦ ? ${config.prefix}portscan <IP/Domain>
¦ ? ${config.prefix}dnslookup <domain>
¦ ? ${config.prefix}whois <domain>
¦ ? ${config.prefix}tempmail (Email ya sekunde 60)
¦
+-------------------------??

+---? ?? MULTI-DOWNLOADERS ENGINE ?
¦
¦ ? ${config.prefix}play <song_name>
¦ ? ${config.prefix}video <song_name>
¦ ? ${config.prefix}spotify <query/link>
¦ ? ${config.prefix}instagram <link>
¦ ? ${config.prefix}facebook <link>
¦ ? ${config.prefix}tiktok <link>
¦ ? ${config.prefix}pinterest <query>
¦
+-------------------------??

+---? ?? AI ARCHITECT & ENGINES ?
¦
¦ ? ${config.prefix}gpt <question>
¦ ? ${config.prefix}gemini <question>
¦ ? ${config.prefix}claude <query>
¦ ? ${config.prefix}imagine <prompt>
¦ ? ${config.prefix}flux <prompt>
¦ ? ${config.prefix}rembg / ${config.prefix}remini
¦
+-------------------------??

+---? ????? ADMIN COMMANDS ?
¦
¦ ? ${config.prefix}ban @user / ${config.prefix}kick @user
¦ ? ${config.prefix}promote @user / ${config.prefix}demote @user
¦ ? ${config.prefix}mute <minutes> / ${config.prefix}unmute
¦ ? ${config.prefix}antilink / ${config.prefix}antibadword
¦ ? ${config.prefix}tagall / ${config.prefix}hidetag
¦
+-------------------------??

+---? ?? OWNER ENGINE & CONTROL ?
¦
¦ ? ${config.prefix}mode <public/private>
¦ ? ${config.prefix}antiviewonce <on/off>
¦ ? ${config.prefix}antidelete <on/off>
¦ ? ${config.prefix}update / ${config.prefix}bc <text>
¦ ? ${config.prefix}anticall <on/off>
¦
+-------------------------??

?? Ungana nasi kwa taarifa zaidi:
${config.whatsappChannel}`;

        // Kutuma menu ikiwa na muktadha mzuri wa maandishi
        await sock.sendMessage(from, { 
            text: menuText,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                externalAdReply: {
                    title: config.botName,
                    body: `Developer: ${config.ownerName}`,
                    thumbnailUrl: "https://i.imgur.com/example.jpg", // Unaweza kuweka link ya picha yako hapa baadaye
                    sourceUrl: config.whatsappChannel,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });
    }
};