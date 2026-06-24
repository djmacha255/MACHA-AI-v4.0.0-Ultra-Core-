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

// UTUNZI WA PORT: Inasoma port yoyote inayopewa na panel (Render, Pterodactyl, Koyeb, nk.)
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

// Sehemu ya kimataifa ya kuhifadhia commands
global.commands = new Map();

// Express configuration kwa ajili ya Web Panel
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 1. MFUMO WA KUPAKIA COMMANDS KIOTOMATIKI (COMMAND HANDLER)
function loadCommands() {
    const commandsPath = path.join(__dirname, "commands");
    if (!fs.existsSync(commandsPath)) {
        fs.mkdirSync(commandsPath);
    }

    try {
        const categories = fs.readdirSync(commandsPath);
        for (const category of categories) {
            const categoryPath = path.join(commandsPath, category);
            
            if (fs.lstatSync(categoryPath).isDirectory()) {
                const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith(".js"));
                
                for (const file of commandFiles) {
                    try {
                        const command = require(path.join(categoryPath, file));
                        if (command.name) {
                            global.commands.set(command.name, command);
                            if (command.aliases && Array.isArray(command.aliases)) {
                                command.aliases.forEach(alias => global.commands.set(alias, command));
                            }
                        }
                    } catch (error) {
                        console.error(`[ERROR] Imeshindwa kupakia amri ${file}:`, error.message);
                    }
                }
            }
        }
        console.log(`[SYSTEM] Jumla ya amri zilizopakiwa kwenye RAM: ${global.commands.size}`);
    } catch (err) {
        console.error("[SYSTEM ERROR] Kushindwa kusoma folda la commands:", err.message);
    }
}

// 2. INJINI KUU YA WHATSAPP & WEB PAIRING
async function startMachaBot(targetNumber = null, res = null) {
    const sessionPath = path.join(__dirname, "temp_sessions");
    
    // Hakikisha folda la session lipo
    await fs.ensureDir(sessionPath);
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
        },
        printQRInTerminal: !targetNumber, // Kama hakuna namba, itaprint QR terminal kwa usalama wa VPS
        logger: pino({ level: "fatal" }),
        browser: ["MACHA-AI", "Chrome", "1.0.0"]
    });

    // Kushughulikia Ombi la Pairing kutoka kwenye Web Panel
    if (targetNumber && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(targetNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                if (res && !res.headersSent) {
                    return res.json({ code });
                }
            } catch (err) {
                console.error("[PAIRING ERROR]", err);
                if (res && !res.headersSent) {
                    return res.status(500).json({ error: "Muda umeisha au imeshindwa kuzalisha kodi." });
                }
            }
        }, 3000);
    }

    // Kufuatilia Muunganisho (Connection State)
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "close") {
            const reason = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            
            console.log(`[CONNECTION] Muunganisho umefungwa (Reason Code: ${reason}). Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                startMachaBot(); // Kuji-reconnect kiotomatiki bila kufunga panel
            }
        } else if (connection === "open") {
            console.log(`[ONLINE] MACHA-AI v${config.version} Imewaka kikamilifu! Mmiliki: ${config.ownerName}`);
            try {
                await sock.sendMessage(config.ownerNumber + "@s.whatsapp.net", { 
                    text: `*MACHA-AI ULTRA-CORE v${config.version} IPO ONLINE!* 🎧\n\nMfumo umewashwa kutoka kwenye Cloud Panel na upo tayari.` 
                });
            } catch (e) {
                console.log("[SYSTEM] Ujumbe wa kuanza haukutumwa, namba ya owner haina usajili sahihi au bot ni mpya.");
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    // MSOMAJI WA UJUMBE NA EXECUTER WA COMMANDS
    sock.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            
            // Auto Read Status
            if (mek.key && mek.key.remoteJid === "status@broadcast") {
                if (config.autoReadStatus === "true") await sock.readMessages([mek.key]);
                return;
            }

            const from = mek.key.remoteJid;
            const type = Object.keys(mek.message)[0];
            
            let body = (type === "conversation") ? mek.message.conversation : 
                       (type === "extendedTextMessage") ? mek.message.extendedTextMessage.text : 
                       (type === "imageMessage") ? mek.message.imageMessage.caption : 
                       (type === "videoMessage") ? mek.message.videoMessage.caption : "";

            const isCmd = body.startsWith(config.prefix);
            const commandName = isCmd ? body.slice(config.prefix.length).trim().split(/ +/).shift().toLowerCase() : "";
            const args = body.trim().split(/ +/).slice(1);
            const text = args.join(" ");
            const isOwner = mek.key.fromMe || from.startsWith(config.ownerNumber);
            
            if (isCmd) {
                if (config.publicMode === "false" && !isOwner) return;

                const cmd = global.commands.get(commandName);
                if (cmd) {
                    await cmd.execute(sock, mek, from, args, text, isOwner);
                }
            }
        } catch (e) {
            console.error("[ERROR IN MESSAGES UPSERT]", e);
        }
    });

    // Anti-Call Block
    sock.ev.on("call", async (callArr) => {
        if (config.antiCallBlock === "true") {
            for (const call of callArr) {
                if (call.status === "offer") {
                    await sock.sendMessage(call.from, { text: "⚠️ *Mifumo ya MACHA-AI haipokei simu.* Umepigwa block kiotomatiki." });
                    await sock.updateBlockStatus(call.from, "block");
                }
            }
        }
    });
}

// 3. API ROUTE KWA AJILI YA PAIRING PANEL
app.get("/api/pair", async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Namba ya simu inahitajika!" });
    num = num.replace(/[^0-9]/g, "");
    console.log(`[WEB API] Ombi la kodi ya pairing kwa namba: ${num}`);
    await startMachaBot(num, res);
});

// 4. MIFUMO YA ULINZI (ANTI-CRASH LOGIC) - HIZI ZINAZUIA SEVA ISIFE PANEL IKIWA LIVE
process.on("uncaughtException", (err) => {
    console.error("[CRITICAL ERROR - UNCAUGHT EXCEPTION]:", err.message);
    // Bot haizimi, inatupa log tu na kuendelea kupiga kazi
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("[CRITICAL ERROR - UNHANDLED REJECTION]: At:", promise, "Reason:", reason);
});

// 5. KUWASHA SEVA RASMI
app.listen(PORT, () => {
    console.log(`[SERVER RUNNING] Mfumo umewaka kwenye Port: ${PORT}`);
    loadCommands();
    startMachaBot(); // Inawasha background engine
});
