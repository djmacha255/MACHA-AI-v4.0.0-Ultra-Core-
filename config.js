const fs = require('fs');
require('dotenv').config();

// Mipangilio ya Msingi ya Mfumo
module.exports = {
    // Taarifa za Mmiliki (Owner Info)
    ownerNumber: process.env.OWNER_NUMBER || '255700000000', // Weka namba yako ya WhatsApp hapa (anza na 255)
    ownerName: process.env.OWNER_NAME || 'DJ MACHA 255',
    instagramHandle: '@djmacha255',
    whatsappChannel: 'https://whatsapp.com/channel/0029VbChEWdGzzKROKvbMh1O',

    // Taarifa za Bot (Bot Info)
    botName: process.env.BOT_NAME || 'MACHA-AI SUPER BOT',
    version: '4.0.0',
    prefix: '.', // Alama ya kuanzia amri (e.g. .menu , .play)
    
    // Mipangilio ya Kazi (Work Modes)
    publicMode: process.env.PUBLIC_MODE || 'true', // 'true' kwa ajili ya kila mtu, 'false' kwa ajili yako tu (private)
    autoReadStatus: process.env.AUTO_READ_STATUS || 'true', // Kusoma status za watu kiotomatiki
    autoReactStatus: process.env.AUTO_REACT_STATUS || 'false', // Ku-react kwenye status za watu
    antiCallBlock: process.env.ANTI_CALL_BLOCK || 'true', // Kupiga block kiotomatiki wanaopiga simu za bot
    antiDeleteMode: process.env.ANTI_DELETE_MODE || 'true', // Kuzuia watu kufuta ujumbe waliokutumia
    antiViewOnce: process.env.ANTI_VIEW_ONCE || 'true', // Kuhifadhi picha za View Once

    // API Keys Placeholders (Kwa ajili ya AI na Huduma zingine mtandaoni)
    // Ukizipata, utaziweka kule Render Environment Variables au hapa
    openaiApiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
    geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
    fluxApiKey: process.env.FLUX_API_KEY || 'YOUR_FLUX_API_KEY',
    removeBgKey: process.env.REMOVE_BG_KEY || 'YOUR_REMOVE_BG_KEY',

    // Ujumbe Maalum (Custom Messages)
    packName: 'MACHA-AI Stiker Hub', // Jina la pakiti ya stika ikitengenezwa
    authorName: '@djmacha255', // Jina la mtengeneza stika
    welcomeMsg: 'Karibu kiongozi @user kwenye kikundi hiki! 🎧',
    goodbyeMsg: 'Alamsiki @user amejiondoa/ameondolewa! 👋',
    pmBlockMsg: 'Samahani kiongozi, siri za PM zimefungwa kwa sasa. Tumia bot kwenye group au wasiliana na @djmacha255!'
};

// Mfumo wa ku-update config kiotomatiki kama faili likibadilika ukiwa unarun local
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Config file updated: '${__filename}'`);
    delete require.cache[file];
    require(file);
});
