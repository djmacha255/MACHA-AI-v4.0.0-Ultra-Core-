// index.js - Umethibitishwa na @djmacha255
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

// =========================================================================
// 📝 SEHEMU YA CONFIGURATION (WEKA NAMBA YA BOT HAPA)
// =========================================================================
const BOT_NUMBER = "255XXXXXXXXX"; // <-- Futa XXXXX na uweke namba ya bot na kodi ya nchi (Mfano: "255712345678")
// =========================================================================

async function startBot() {
    console.log("\n🚀 [SERVER STARTING] Mfumo unaanzishwa kwenye panel...");
    
    // 1. Kutengeneza na kusoma folder la Session
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();

    // 2. Cfg ya muunganisho wa WhatsApp
    const client = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }), 
        printQRInTerminal: false, // Imezimwa kabisa
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"] 
    });

    // 3. MFUMO WA PAIRING CODE (Kasi ya Panel - Non-Interactive)
    if (!client.authState.creds.registered) {
        console.log("\n📱 [PAIRING SYSTEM] Bot haijaunganishwa kwenye WhatsApp yoyote.");
        
        // Angalia kama mtumiaji amesahau kubadilisha namba ya mfano
        if (!BOT_NUMBER || BOT_NUMBER.includes("XXXXXXXXX")) {
            console.log("\n❌ ERROR: Tafadhali fungua index.js na uweke namba yako sahihi ya simu kwenye mstari wa 13!");
            process.exit(1);
        }

        const cleanedNumber = BOT_NUMBER.replace(/[^0-9]/g, '');
        console.log(`⏳ Inatengeneza Pairing Code kiotomatiki kwa ajili ya namba: ${cleanedNumber}...`);
        await delay(3000);

        try {
            let code = await client.requestPairingCode(cleanedNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code; 
            
            console.log("\n=============================================");
            console.log(`🔑 APKA PAIRING CODE YAKO: \x1b[32m${code}\x1b[0m`);
            console.log("=============================================\n");
            console.log("👉 HATUA ZA KUFANYA KWENYE SIMU YAKO:");
            console.log("1. Fungua WhatsApp ya namba hiyo.");
            console.log("2. Nenda: Settings > Linked Devices.");
            console.log("3. Bonyeza 'Link a Device' kisha chagua 'Link with phone number instead'.");
            console.log(`4. Ingiza huu msimbo hapo juu: [\x1b[32m${code}\x1b[0m]`);
            console.log("\n_Bot itasubiri hadi uingize msimbo huo kwenye simu..._");
        } catch (error) {
            console.error("❌ Hitilafu imetokea wakati wa kuomba code:", error);
            process.exit(1);
        }
    }

    // 4. KUPAKIA AMRI (COMMANDS LOADER)
    global.commands = global.commands || new Map();
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
                console.log(`⚠️ Kushindwa kupakia amri kutoka faili: ${file}`);
            }
        }
        console.log(`[SYSTEM] Jumla ya amri zilizopakiwa kwenye RAM: ${global.commands.size}`);
    }

    // 5. KUNASA HALI YA MUUNGANISHO
    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`[CONNECTION] Muunganisho umefungwa. Reason Code: ${reason}`);

            if (reason === DisconnectReason.restartRequired || reason === 408) {
                console.log("⏳ Inajaribu kuwaka upya yenyewe...");
                await delay(5000); 
                startBot();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Bot imetolewa (Logged Out). Inafuta session ya zamani...");
                if (fs.existsSync(path.join(__dirname, "session"))) {
                    fs.rmSync(path.join(__dirname, "session"), { recursive: true, force: true });
                }
                process.exit(1);
            } else {
                console.log(`⚠️ Muunganisho umefungwa (Code: ${reason}). Inajizima yenyewe ili isilete loop.`);
                process.exit(1);
            }
        } else if (connection === "open") {
            console.log("\n=============================================");
            console.log("✅ [SUCCESS] Bot imeunganishwa kikamilifu kwenye WhatsApp!");
            console.log("=============================================\n");
        }
    });

    client.ev.on("creds.update", saveCreds);

    // 6. JUMBE HANDLER LINK
    client.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            // Hapa itasoma message logic yako ya kawaida
        } catch (err) {
            console.error("Error in message upsert:", err);
        }
    });
}

startBot().catch(err => console.error("Critical Error on startup:", err));
