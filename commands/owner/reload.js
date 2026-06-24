const fs = require("fs");
const path = require("path");
const config = require("../../config");

module.exports = {
    name: "reload",
    description: "Kusoma ma-faili yote ya amri upya bila kuzima bot",
    async execute(sock, mek, from, args, text, isOwner) {
        if (!isOwner) return await sock.sendMessage(from, { text: "❌ Amri hii ni ya mmiliki pekee!" });

        await sock.sendMessage(from, { text: "🔄 _MACHA-AI inasafisha na kupakia amri zote upya (Hot Reloading)..._" });

        const commandsPath = path.join(__dirname, "../../commands");
        
        // Kufuta cache zote za zamani na kupakia upya
        const commandFolders = fs.readdirSync(commandsPath);
        let jumla = 0;

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
                for (const file of commandFiles) {
                    const filePath = path.join(folderPath, file);
                    
                    // Hapa tunafuta kache ya Node.js
                    delete require.cache[require.resolve(filePath)]; 
                    jumla++;
                }
            }
        }

        await sock.sendMessage(from, { text: `✅ *Mchakato Umekamilika!* Jumla ya amri *${jumla}* zimesomwa upya na ziko tayari kureni.` });
    }
};
