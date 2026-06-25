// index.js - Umethibitishwa na @djmacha255
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    delay, 
    fetchLatestBaileysVersion,
    getContentType
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");

// =========================================================================
// 📝 SEHEMU YA CONFIGURATION (WEKA NAMBA YA BOT HAPA)
// =========================================================================
const BOT_NUMBER = "255XXXXXXXXX"; // <-- Futa XXXXX na uweke namba ya bot pamoja na kodi ya nchi (Mfano: "255712345678")
// =========================================================================

// Kutengeneza database za muda kwenye memory (RAM) ili zisiishe au kupotea mapema
global.antiedit = global.antiedit || {};
global.commands = global.commands || new Map();

async function startBot() {
    console.log("\n🚀 [MACHA-AI] Mfumo unaanzishwa kwenye panel...");
    
    // 1. Kutengeneza na kusoma folder la Session
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, "session"));
    const { version } = await fetchLatestBaileysVersion();

    // 2. Cfg kuu ya muunganisho wa WhatsApp
    const client = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }), 
        printQRInTerminal: false, // IMEZIMWA KABISA: Inafuta lile onyo la njano kwenye Capture.PNG
        version,
        browser: ["Ubuntu", "Chrome", "20.0.04"] // Muhimu sana ili Pairing Code ikubalike na WhatsApp
    });

    // 3. MFUMO WA PAIRING CODE (Kasi ya Panel - Non-Interactive)
    if (!client.authState.creds.registered) {
        console.log("\n📱 [PAIRING SYSTEM] Bot haijaunganishwa kwenye WhatsApp yoyote.");
        
        // Angalia kama mtumiaji amesahau kubadilisha namba ya mfano kwenye mstari wa 14
        if (!BOT_NUMBER || BOT_NUMBER.includes("XXXXXXXXX")) {
            console.log("\n❌ ERROR: Tafadhali fungua index.js na uweke namba yako sahihi ya simu kwenye mstari wa 14!");
            process.exit(1);
        }

        const cleanedNumber = BOT_NUMBER.replace(/[^0-9]/g, '');
        console.log(`⏳ Inatengeneza Pairing Code kiotomatiki kwa ajili ya namba: ${cleanedNumber}...`);
        await delay(3000);

        try {
            let code = await client.requestPairingCode(cleanedNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code; // Inaiweka kwenye muundo wa XXXX-XXXX
            
            console.log("\n=============================================");
            console.log(`🔑 APKA PAIRING CODE YAKO: \x1b[32m${code}\x1b[0m`);
            console.log("=============================================\n");
            console.log("👉 HATUA ZA KUFANYA KWENYE SIMU YAKO:");
            console.log("1. Fungua WhatsApp ya namba hiyo.");
            console.log("2. Nenda: Settings > Linked Devices (Vifaa Vilivyounganishwa).");
            console.log("3. Bonyeza 'Link a Device' kisha chagua 'Link with phone number instead'.");
            console.log(`4. Ingiza huu msimbo hapo juu: [\x1b[32m${code}\x1b[0m]`);
            console.log("\n_Bot itasubiri hadi uingize msimbo huo kwenye simu yako..._");
        } catch (error) {
            console.error("❌ Hitilafu imetokea wakati wa kuomba code:", error);
            process.exit(1);
        }
    }

    // 4. KUPAKIA AMRI (COMMANDS LOADER - AMRI ZAKO 45)
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

    // 5. KUNASA HALI YA MUUNGANISHO (CONNECTION UPDATE)
    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`[CONNECTION] Muunganisho umefungwa. Reason Code: ${reason}`);

            // Kutatua tatizo la 408 Timeout na Loops zisizoisha zilizopo kwenye Capture.PNG
            if (reason === DisconnectReason.restartRequired || reason === 408) {
                console.log("⏳ Inajaribu kuwaka upya yenyewe hivi sasa...");
                await delay(5000); // Subiri sekunde 5 kabla ya kuwaka upya kuzuia spamming loops
                startBot();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log("❌ Bot imetolewa (Logged Out) kwenye simu. Inafuta session ya zamani...");
                if (fs.existsSync(path.join(__dirname, "session"))) {
                    fs.rmSync(path.join(__dirname, "session"), { recursive: true, force: true });
                }
                console.log("Session imefutwa. Washa bot upya ili uunge akaunti nyingine.");
                process.exit(1);
            } else {
                console.log(`⚠️ Muunganisho umefungwa kabisa. Sababu Code: ${reason}. Inajizima.`);
                process.exit(1);
            }
        } else if (connection === "open") {
            console.log("\n=============================================");
            console.log("✅ [SUCCESS] Bot imeunganishwa kikamilifu kwenye WhatsApp!");
            console.log("=============================================\n");
            
            // Tuma ujumbe wa uthibitisho kwa namba ya bot yenyewe ikizinduka vizuri
            const selfJid = client.user.id.split(":")[0] + "@s.whatsapp.net";
            await client.sendMessage(selfJid, { 
                text: "✅ *Macha-AI Iko Tayari!* \n\nMfumo umewaka kikamilifu kwenye panel na ulinzi umeanza otomatiki. Created by @djmacha255" 
            });
        }
    });

    // Kuhifadhi mabadiliko ya faili la login (session) kila yanapotokea
    client.ev.on("creds.update", saveCreds);

    // 6. JUMBE HANDLER LINK NA EVENT YA ANTI-EDIT
    client.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message) return;
            
            const chatId = m.key.remoteJid;

            // KINASAJI CHA ANTI-EDIT (Kazi ya kunasa ujumbe uliorekebishwa hapo hapo)
            const mtype = getContentType(m.message);
            if (mtype === 'protocolMessage' && m.message.protocolMessage?.type === 14) {
                let editEvent = m.message.protocolMessage;

                // Angalia kama kundi hili limewasha mfumo wa Anti-Edit
                if (global.antiedit && global.antiedit[chatId]) {
                    let editedMessage = editEvent.editedMessage;
                    let sender = m.key.participant || m.key.remoteJid;
                    let pushName = m.pushName || "Mtumiaji";

                    let originalText = editedMessage?.conversation || 
                                       editedMessage?.extendedTextMessage?.text || 
                                       editedMessage?.imageMessage?.caption || 
                                       editedMessage?.videoMessage?.caption || "Ujumbe wa Media/Mfumo";

                    let alertText = `⚠️ *UJUMBE ULIOHARIRIWA (ANTI-EDIT)* ⚠️\n\n` +
                                    `👤 *Kutoka:* @${sender.split('@')[0]} (${pushName})\n` +
                                    `💬 *Ujumbe wa Mwanzo:* ${originalText}\n\n` +
                                    `_Bot imenasia mabadiliko haya otomatiki._`;

                    await client.sendMessage(chatId, { 
                        text: alertText, 
                        mentions: [sender] 
                    }, { quoted: m });
                }
            }

            // KUWASILISHA UJUMBE WA KAKAWIDA KWENYE message.js (Kupitisha kwenye Commands zote kama .apk au .vote)
            const messageHandlerPath = path.join(__dirname, "message.js");
            if (fs.existsSync(messageHandlerPath)) {
                await require('./message')(client, m);
            }
            
        } catch (err) {
            console.error("Error in messages.upsert:", err);
        }
    });
}

// Kuwasha rasmi mfumo mkuu
startBot().catch(err => console.error("Critical Error on startup:", err));
