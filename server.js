const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const express = require("express");
const pino = require("pino");
const path = require("path");
const fs = require("fs-extra");
const config = require("./config");

const app = express();
const PORT = process.env.PORT || 3000;

// Sehemu ya kuhifadhia commands
global.commands = new Map();

// Express Configuration
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 1. AUTOMATED COMMAND HANDLER (Kupakia Amri Kiotomatiki)
function loadCommands() {
    const commandsPath = path.join(__dirname, "commands");
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath);
    }

    const categories = fs.readdirSync(commandsPath);
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        
        // Hakikisha ni folda
        if (fs.lstatSync(categoryPath).isDirectory()) {
            const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith(".js"));
            
            for (const file of commandFiles) {
                try {
                    const command = require(path.join(categoryPath, file));
                    if (command.name) {
                        global.commands.set(command.name, command);
                        // Kama kuna majina mbadala (aliases)
                        if (command.aliases && Array.isArray(command.aliases)) {
                            command.aliases.forEach(alias => global.commands.set(alias, command));
                        }
                    }
                } catch (error) {
                    console.error(`Imeshindwa kupakia amri ${file} kwenye kundi la ${category}:`, error.message);
                }
            }
        }
    }
    console.log(`[SYSTEM] Jumla ya amri zilizopakiwa: ${global.commands.size}`);
}

// 2. WHATSAPP CONNECTION ENGINE WITH WEB PAIRING
async function startMachaBot(targetNumber = null, res = null) {
    const sessionPath = path.join(__dirname, "temp_sessions");
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        },
        printQRInTerminal: false, // Tunatumia Pairing Code badala ya QR
        logger: pino({ level: "fatal" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    // Mfumo wa kuzalisha Pairing Code kwa ajili ya Web Panel
    if (targetNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(targetNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                if (res && !res.headersSent) {
                    return res.json({ code });
                }
            } catch (err) {
                console.error("Pairing Error:", err);
                if (res && !res.headersSent) {
                    return res.status(500).json({ error: "Imeshindwa kuzalisha kodi ya pairing" });
                }
            }
        }, 3000);
    }

    // Kusikiliza mabadiliko ya muunganisho (Connection Monitor)
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`[CONNECTION] Muunganisho umefungwa kwa sababu ya: ${lastDisconnect?.error}. Inajionganisha upya: ${shouldReconnect}`);
            if (shouldReconnect) {
                startMachaBot(); // Kuji-reconnect kiotomatiki
            }
        } else if (connection === "open") {
            console.log(`[SUCCESS] MACHA-AI v${config.version} Ipo Online Sasa! [Owner: ${config.ownerName}]`);
            // Tuma ujumbe wa uthibitisho kwa mmiliki
            await sock.sendMessage(config.ownerNumber + "@s.whatsapp.net", { 
                text: `*MACHA-AI ULTRA-CORE v${config.version} IMESIMAMA MTANDAONI!* 🎧\n\nSeva ipo hai na tayari kupokea amri.` 
            });
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // 3. INCOMING MESSAGES ENGINE (Mpokeaji na Mchambuzi wa Amri)
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            if (mek.key && mek.key.remoteJid === "status@broadcast") {
                if (config.autoReadStatus === "true") await sock.readMessages([mek.key]);
                return;
            }

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            
            // Kuchambua ujumbe wa maandishi
            let body = (type === "conversation") ? mek.message.conversation : 
                       (type === "extendedTextMessage") ? mek.message.extendedTextMessage.text : 
                       (type === "imageMessage") ? mek.message.imageMessage.caption : 
                       (type === "videoMessage") ? mek.message.videoMessage.caption : "";

            const isCmd = body.startsWith(config.prefix);
            const commandName = isCmd ? body.slice(config.prefix.length).trim().split(/ +/).shift().toLowerCase() : "";
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(" ");

            // Ukaguzi wa Haki za Mtumiaji (Security Checks)
            const isOwner = mek.key.fromMe || from.startsWith(config.ownerNumber);
            
            if (isCmd) {
                // Kama mfumo upo kwenye private mode na mtumiaji si mmiliki
                if (config.publicMode === "false" && !isOwner) return;

                const cmd = global.commands.get(commandName);
                if (cmd) {
                    console.log(`[EXECUTE] ${mek.pushName || "User"} amechochea amri: ${config.prefix}${commandName}`);
                    await cmd.execute(sock, mek, from, args, text, isOwner);
                }
            }
        } catch (e) {
            console.error("[ERROR IN UPSERT]", e);
        }
    });

    // 4. ANTI-CALL SYSTEM (Kuzuia na Kupiga Block Wanaopiga Simu za Bot)
    sock.ev.on("call", async (callArr) => {
        if (config.antiCallBlock === "true") {
            for (const call of callArr) {
                if (call.status === "offer") {
                    console.log(`[ANTI-CALL] Inamzuia ${call.from} kwa sababu amepiga simu ya Bot.`);
                    await sock.sendMessage(call.from, { text: "⚠️ *Mifumo ya MACHA-AI haipokei simu.* Umepigwa marufuku kiotomatiki (Blocked). Wasiliana na mmiliki kwa msaada." });
                    await sock.updateBlockStatus(call.from, "block");
                }
            }
        }
    });
}

// 5. API ROUTE FOR THE WEB FRONTEND PAIRING PANEL
app.get("/api/pair", async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Namba ya simu inahitajika!" });
    
    // Safisha namba ili ibakiwe na tarakimu tu
    num = num.replace(/[^0-9]/g, "");
    
    console.log(`[WEB PANEL] Ombi jipya la pairing kwa namba: ${num}`);
    await startMachaBot(num, res);
});

// Kuwasha seva ya Express na upakiaji wa amri
app.listen(PORT, () => {
    console.log(`[SERVER] Web Panel inarun kwenye port: http://localhost:${PORT}`);
    loadCommands();
    // Washa muunganisho wa msingi kama session ipo
    startMachaBot();
});
