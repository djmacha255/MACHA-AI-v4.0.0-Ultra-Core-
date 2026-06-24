const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
    name: "install",
    aliases: ["plugin", "addcmd"],
    description: "Kusakinisha plugin mpya kwa kutumia link ya Raw Javascript",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!isOwner) return await sock.sendMessage(from, { text: "❌ Amri hii ni ya mmiliki pekee!" });

        if (!args[0] || !args[0].includes("http")) {
            return await sock.sendMessage(from, { 
                text: "⚠️ *Weka link sahihi ya Raw JS!*\n\nMfano:\n`.install https://gist.githubusercontent.com/user/raw/custom_cmd.js`" 
            }, { quoted: mek });
        }

        const url = args[0];
        
        // Kutengeneza jina la faili kiotomatiki au kutumia lililopo mwishoni mwa link
        let fileName = url.split("/").pop();
        if (!fileName.endsWith(".js")) {
            fileName = `plugin_${Date.now()}.js`;
        }

        await sock.sendMessage(from, { text: `📥 _MACHA-AI inapakua plugin (${fileName})..._` }, { quoted: mek });

        try {
            // 1. Kuvuta kodi kutoka kwenye mtandao
            const response = await axios.get(url);
            const pluginCode = response.data;

            // 2. Uhakiki wa Usalama: Hakikisha ina muundo wa amri zetu
            if (!pluginCode.includes("module.exports") || !pluginCode.includes("name")) {
                return await sock.sendMessage(from, { text: "❌ *Faili hili halina muundo sahihi wa MACHA-AI!* Hakikisha lina `module.exports` na `name`." }, { quoted: mek });
            }

            // 3. Hakikisha folda maalum la plugins lipo
            const pluginsFolder = path.join(__dirname, "../../commands/plugins");
            await fs.ensureDir(pluginsFolder);

            // 4. Hifadhi faili hilo ndani ya commands/plugins/
            const targetPath = path.join(pluginsFolder, fileName);
            await fs.writeFile(targetPath, pluginCode, "utf8");

            // 5. HOT RELOAD: Kufuta kache na kusoma amri zote upya papo hapo
            const commandsPath = path.join(__dirname, "../../commands");
            const commandFolders = fs.readdirSync(commandsPath);

            for (const folder of commandFolders) {
                const folderPath = path.join(commandsPath, folder);
                if (fs.lstatSync(folderPath).isDirectory()) {
                    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
                    for (const file of commandFiles) {
                        const filePath = path.join(folderPath, file);
                        delete require.cache[require.resolve(filePath)]; // Futa cache ya zamani
                    }
                }
            }

            // Pakia upya kwenye RAM ya global.commands
            global.commands.clear(); // Safisha ram ya zamani
            
            // Re-load zote upya ikijumuisha folda jipya la plugins
            const reCategories = fs.readdirSync(commandsPath);
            for (const cat of reCategories) {
                const catPath = path.join(commandsPath, cat);
                if (fs.lstatSync(catPath).isDirectory()) {
                    const files = fs.readdirSync(catPath).filter(f => f.endsWith(".js"));
                    for (const f of files) {
                        const cmd = require(path.join(catPath, f));
                        if (cmd.name) {
                            global.commands.set(cmd.name, cmd);
                            if (cmd.aliases) cmd.aliases.forEach(a => global.commands.set(a, cmd));
                        }
                    }
                }
            }

            await sock.sendMessage(from, { 
                text: `✅ *Plugin Imetandikwa Rasmi!*\n\n📦 *Jina:* \`${fileName}\`\n🚀 Mfumo umeisoma na sasa ipo hewani bila kurestart seva.` 
            }, { quoted: mek });

        } catch (error) {
            console.error("Plugin Install Error:", error.message);
            await sock.sendMessage(from, { text: `❌ *Ufungaji umefeli!* Hitilafu: ${error.message}` }, { quoted: mek });
        }
    }
};
