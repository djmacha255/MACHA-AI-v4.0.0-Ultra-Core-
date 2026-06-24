const fs = require("fs-extra");
const path = require("path");

module.exports = {
    name: "uninstall",
    aliases: ["delplugin", "remcmd"],
    description: "Kufuta plugin iliyosakinishwa kwa WhatsApp",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!isOwner) return;

        if (!text) return await sock.sendMessage(from, { text: "⚠️ Weka jina kamili la faili la plugin (Mfano: `.uninstall wimbo.js`)" });

        const targetFile = text.trim();
        const pluginPath = path.join(__dirname, "../../commands/plugins", targetFile);

        if (!fs.existsSync(pluginPath)) {
            return await sock.sendMessage(from, { text: "❌ Faili hilo halipatikani kwenye folda la plugins." });
        }

        try {
            await fs.unlink(pluginPath); // Futa faili
            
            // Futa kache na usome upya (Kama tulivyofanya kwenye install.js)
            // [Hapa unaweza kuandika tu amri ya kureload au kumwambia aandike .reload baada ya hapa]
            
            await sock.sendMessage(from, { text: `✅ Faili \`${targetFile}\` limefutwa kabisa! Andika \`.reload\` ili kusafisha kumbukumbu.` });
        } catch (err) {
            await sock.sendMessage(from, { text: `❌ Imeshindwa kufuta: ${err.message}` });
        }
    }
};
