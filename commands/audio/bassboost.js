const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs-extra");
const path = require("path");
const config = require("../../config");

module.exports = {
    name: "bassboost",
    aliases: ["bass", "besi"],
    description: "Kuongeza besi nzito kwenye audio/voice note",
    async execute(sock, mek, from, args, text, isOwner) {
        // 1. Angalia kama mtumiaji ame-reply ujumbe wa sauti (audio)
        const quotedMsg = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const mimeType = quotedMsg?.audioMessage?.mimetype;

        if (!quotedMsg || !quotedMsg.audioMessage) {
            return await sock.sendMessage(from, { 
                text: `?? *Kiongozi, reply ujumbe wa sauti (Audio au Voice Note) kisha andika \`${config.prefix}bassboost\`*` 
            }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: "??? _MACHA-AI Studio inachuja na kuongeza Besi (Equalizing Bass)..._" }, { quoted: mek });

        // Tengeneza majina ya ma-faili ya muda (Temp Files)
        const inputPath = path.join(__dirname, `../../temp_input_${Date.now()}.mp3`);
        const outputPath = path.join(__dirname, `../../temp_output_${Date.now()}.mp3`);

        try {
            // 2. Kupakua audio kutoka WhatsApp seva
            const stream = await downloadContentFromMessage(quotedMsg.audioMessage, "audio");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            // Hifadhi faili la awali kwenye diski
            await fs.writeFile(inputPath, buffer);

            // 3. Kuchanganya kete za FFmpeg (Bass Equalizer Filter: g=20 inaongeza 20dB ya besi chini ya 60Hz)
            ffmpeg(inputPath)
                .outputOptions(["-af", "equalizer=f=60:width_type=h:w=50:g=20"])
                .save(outputPath)
                .on("end", async () => {
                    // 4. Tuma audio iliyokamilika kurudi kwa mtumiaji
                    await sock.sendMessage(from, { 
                        audio: { url: outputPath }, 
                        mimetype: mimeType, 
                        ptt: quotedMsg.audioMessage.ptt // Kama ilikuwa VN, inarudi kama VN
                    }, { quoted: mek });

                    // Safisha ma-faili ya muda kuzuia seva kujaa disk space
                    await fs.unlink(inputPath);
                    await fs.unlink(outputPath);
                })
                .on("error", async (err) => {
                    console.error("FFmpeg Error:", err);
                    await sock.sendMessage(from, { text: "? *Mchakato wa sauti umefeli!* Hakikisha FFmpeg imewekwa vizuri kwenye seva." }, { quoted: mek });
                    if (fs.existsSync(inputPath)) await fs.unlink(inputPath);
                });

        } catch (error) {
            console.error("Bassboost Command Error:", error.message);
            await sock.sendMessage(from, { text: "? *Hitilafu imetokea wakati wa kupakua sauti.*" }, { quoted: mek });
        }
    }
};