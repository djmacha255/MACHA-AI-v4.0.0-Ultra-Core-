const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs-extra");
const path = require("path");
const config = require("../../config");

module.exports = {
    name: "slowreverb",
    aliases: ["slowed", "reverb"],
    description: "Kupunguza kasi ya wimbo na kuweka mwangwi (Slowed + Reverb)",
    async execute(sock, mek, from, args, text, isOwner) {
        const quotedMsg = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const mimeType = quotedMsg?.audioMessage?.mimetype;

        if (!quotedMsg || !quotedMsg.audioMessage) {
            return await sock.sendMessage(from, { 
                text: `?? *Reply wimbo au sauti kisha andika \`${config.prefix}slowreverb\` kiongozi!*` 
            }, { quoted: mek });
        }

        await sock.sendMessage(from, { text: "?? _Inapunguza kasi na kuweka mwangwi (Aesthetic Slow + Reverb)..._" }, { quoted: mek });

        const inputPath = path.join(__dirname, `../../temp_input_sr_${Date.now()}.mp3`);
        const outputPath = path.join(__dirname, `../../temp_output_sr_${Date.now()}.mp3`);

        try {
            const stream = await downloadContentFromMessage(quotedMsg.audioMessage, "audio");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await fs.writeFile(inputPath, buffer);

            // 3. Logic ya FFmpeg:
            // atempo=0.85 (inapunguza kasi hadi 85%)
            // asetrate=44100*0.85 (inashusha pichi ili iendane na kasi)
            // aresample=44100, freeverb (inaweka ule mwangwi wa chumba kikubwa)
            ffmpeg(inputPath)
                .outputOptions(["-af", "asetrate=44100*0.85,aresample=44100,aecho=0.8:0.9:1000:0.3"])
                .save(outputPath)
                .on("end", async () => {
                    await sock.sendMessage(from, { 
                        audio: { url: outputPath }, 
                        mimetype: mimeType, 
                        ptt: false 
                    }, { quoted: mek });

                    await fs.unlink(inputPath);
                    await fs.unlink(outputPath);
                })
                .on("error", async (err) => {
                    console.error("FFmpeg Slowreverb Error:", err);
                    await sock.sendMessage(from, { text: "? *Imeshindwa kuweka madoido ya sauti.*" }, { quoted: mek });
                    if (fs.existsSync(inputPath)) await fs.unlink(inputPath);
                });

        } catch (error) {
            console.error("Slowreverb Command Error:", error.message);
            await sock.sendMessage(from, { text: "? *Imeshindwa kuchakata amri hii.*" }, { quoted: mek });
        }
    }
};