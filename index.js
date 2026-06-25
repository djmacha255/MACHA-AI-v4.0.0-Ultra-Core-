// index.js - Umethibitishwa na @djmacha255 kwa ajili ya Render
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay, 
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const http = require("http"); // Muhimu kwa ajili ya Render Port Binding

// =========================================================================
// 📝 CONFIGURATION (WEKA NAMBA YAKO CHINI)
// =========================================================================
const BOT_NUMBER = "255XXXXXXXXX"; // Weka namba ya bot na kodi ya nchi (Mfano: 255712345678)
const PORT = process.env.PORT || 3000; // Render itapita hapa
// =========================================================================

global.antiedit = global.antiedit || {};
global.commands = global.commands || new Map();

// 🛠 KASEVA KA HTTP ILI RENDER ISIZIME BOT (PORT BINDING)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Macha-AI Iko Live na Inafanya Kazi!\n');
});
server.listen(PORT, () => {
    console.log(`🌐 [RENDER] Kaseva ka ulinzi kanasikiliza kwenye Port: ${PORT}`);
});

async function startBot() {
    console.log("\n🚀 [MACHA-AI] Mfumo unaanzishwa kwenye Render...");
    
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }), 
        printQRInTerminal: false,
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // MFUMO WA PAIRING CODE FOR RENDER LOGS
    if (!client.authState.creds.registered) {
        if (!BOT_NUMBER || BOT_NUMBER.includes("XXXXXXXXX")) {
            console.log("\n❌ ERROR: Weka namba yako sahihi mstari wa 13!");
            process.exit(1);
        }
        const cleanedNumber = BOT_NUMBER.replace(/[^0-9]/g, '');
        await delay(5000); // Subiri sekunde 5 Render iweke logi vizuri
        try {
            let code = await client.requestPairingCode(cleanedNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log("\n=============================================");
            console.log(`🔑 APKA PAIRING CODE YAKO HUYU HAPA: ${code}`);
            console.log("=============================================\n");
        } catch (error) {
            console.error("❌ Kushindwa kuomba Pairing Code:", error);
        }
    }

    // KUPAKIA AMRI (COMMANDS LOADER)
    const commandsPath = path.join(__dirname, "commands");
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command.name) {
                    global.commands.set(command.name, command);
                }
            } catch (e) {
                console.log(`⚠️ Kushindwa kupakia amri ya faili: ${file}. Hitilafu: ${e.message}`);
            }
        }
        console.log(`[SYSTEM] Jumla ya amri zilizopakiwa kwenye RAM: ${global.commands.size}`);
    }

    // MUUNGANISHO NA UJUMBE WA UKURASA WA KWANZA
    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`[CONNECTION] Imefungwa. Sababu: ${reason}`);

            if (reason === DisconnectReason.restartRequired || reason === 408) {
                console.log("⏳ Inajiwasha upya...");
                startBot();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Bot imetolewa. Inafuta session...");
                if (fs.existsSync(path.join(__dirname, "session"))) {
                    fs.rmSync(path.join(__dirname, "session"), { recursive: true, force: true });
                }
                process.exit(1);
            } else {
                startBot(); // Kwenye Render, ijwashe yenyewe kila ikikata mtandao
            }
        } else if (connection === "open") {
            console.log("\n✅ [SUCCESS] Bot imeunganishwa kikamilifu!");
            
            // 📩 UJUMBE WA THIBITISHO: Unatumwa kwenye WhatsApp yako bot ikiwaka
            const selfJid = client.user.id.split(":")[0] + "@s.whatsapp.net";
            await client.sendMessage(selfJid, { 
                text: "✅ *Macha-AI Iko Tayari (Render Server)!* \n\nMfumo umewaka na commands zote ziko tayari kutumika kwa kasi kubwa. 🚀\n\nCreated by @djmacha255" 
            });
        }
    });

    client.ev.on("creds.update", saveCreds);

    // KUSOMA JUMBE NA COMMANDS VIA message.js
    client.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;

            const messageHandlerPath = path.join(__dirname, "message.js");
            if (fs.existsSync(messageHandlerPath)) {
                await require('./message')(client, m);
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err);
        }
    });
}

startBot().catch(err => console.error("Critical Error:", err));
