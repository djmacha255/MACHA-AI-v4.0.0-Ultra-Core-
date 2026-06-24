// apk.js - Umethibitishwa na @djmacha255
const axios = require('axios');

module.exports = {
    name: "apk",
    category: "download",
    desc: "Kutafuta na kupakua programu za Android (APK).",
    async execute(m, { client, text, args }) {
        // Angalia kama mtumiaji ameweka jina la app
        if (!text) {
            return m.reply("⚠️ Tafadhali weka jina la programu unayotaka kupakua!\n\nMfano:\n*.apk whatsapp lite*\n*.apk facebook*");
        }

        try {
            // Mjulishe mtumiaji kuwa kazi imeanza
            await m.reply(`⏳ Tafadhali subiri, natafuta na kuandaa APK ya *${text}*...`);

            // Tunatumia API ya umma inayotegemewa kupata data za APK
            const apiUrl = `https://api.dorratz.com/v1/apk?q=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl);
            
            // Angalia kama data zimepatikana
            if (!response.data || !response.data.status || !response.data.result) {
                return m.reply("❌ Samahani, nimeshindwa kupata programu hiyo kwa sasa. Hakikisha umeandika jina kwa usahihi.");
            }

            const appData = response.data.result;
            const appName = appData.name || text;
            const downloadUrl = appData.download;
            const appSize = appData.size || "Haijulikani";
            const appIcon = appData.icon;
            const packName = appData.id || "com.apk";

            // Kama faili ni kubwa sana (Mfano zaidi ya 100MB), unaweza kuweka tahadhari hapa kutegemea uwezo wa seva yako
            
            // 1. Tuma kwanza maelezo ya App pamoja na Icon yake kama ipo
            let detailsText = `📦 *APK DOWNLOADER* 📦\n\n` +
                              `📛 *Jina:* ${appName}\n` +
                              `🆔 *Package:* ${packName}\n` +
                              `⚖️ *Ukubwa:* ${appSize}\n\n` +
                              `_Faili linapakiwa sasa hivi, subiri kidogo..._`;

            if (appIcon) {
                await client.sendMessage(m.chat, { image: { url: appIcon }, caption: detailsText }, { quoted: m });
            } else {
                await m.reply(detailsText);
            }

            // 2. Tuma lile faili la APK lenyewe kama Document (.apk)
            await client.sendMessage(m.chat, {
                document: { url: downloadUrl },
                mimetype: 'application/vnd.android.package-archive',
                fileName: `${appName}.apk`,
                caption: `Done! Created by @djmacha255`
            }, { quoted: m });

        } catch (error) {
            console.error("APK Download Error:", error);
            m.reply("❌ Hitilafu imetokea wakati wa kutafuta au kupakua APK hiyo. Jaribu tena baadae.");
        }
    }
};
