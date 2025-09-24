
const PastebinAPI = require('pastebin-js');
const pastebin = new PastebinAPI('EMWTMkQAVfJa9kM-MRUrxd5Oku1U7pgL');
const { makeid } = require('./id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require('pino');
const {
    default: WhatsAppClient,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers
} = require('@whiskeysockets/baileys');

// Add chalk for colored console output (you'll need to install it: npm install chalk)
const chalk = require('chalk');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;
    
    async function generatePairCode() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let client = WhatsAppClient({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: pino({ level: 'fatal' }).child({ level: 'fatal' }),
                browser: Browsers.macOS('Chrome')
            });

            if (!client.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await client.requestPairingCode(num);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            client.ev.on('creds.update', saveCreds);
            client.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect } = s;
                if (connection === 'open') {
                    await delay(5000);
                    
                    // Add group joining functionality
                    try {
                        await client.groupAcceptInvite('LVtMOpKXWogECSmtBylUix');
                        console.log(chalk.green('[GROUP] Successfully joined the group!'));
                    } catch (groupErr) {
                        console.error(chalk.red('[GROUP] Error joining group:'), groupErr);
                    }
                    
                    let data = fs.readFileSync(__dirname + `/temp/${id}/creds.json`);
                    await delay(800);
                    let b64data = Buffer.from(data).toString('base64');
                    let session = await client.sendMessage(client.user.id, { text: 'Anonymous;;;' + b64data });

                    let successMessage = `
        
╔════════════════════◇
║『 SESSION CONNECTED』
║ ✨ANONYMOUS-MD👻
║ ✨Terrivez🤓
╚════════════════════╝`;

                    await client.sendMessage(client.user.id, { text: successMessage }, { quoted: session });

                    await delay(100);
                    await client.ws.close();
                    return await removeFile('./temp/' + id);
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10000);
                    generatePairCode();
                }
            });
        } catch (err) {
            console.log('Service restarted');
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }
    
    return await generatePairCode();
});

module.exports = router;
