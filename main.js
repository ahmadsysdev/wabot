/*
 * WhatsApp Automation Project - WebSocket
 *
 * Description: This script automates logging in to WhatsApp Web using WebSocket connections.
 * It allows you to authenticate and establish a session with WhatsApp Web from the terminal
 * using a WebSocket client. This script is intended for educational and personal use only.
 * Use it responsibly and respect WhatsApp's terms of service and user privacy.
 *
 * Author: Ahmad Sysdev
 * Version: 1.0
 * Last Updated: 6 August 2023
 *
 * Disclaimer: This script is provided "as is" without warranty of any kind. The author will not be
 * responsible for any misuse, damage, or consequences caused by using this script.
 *
 * Usage: Before running the script, make sure you have Node.js installed on your system.
 * Install the required dependencies by running "npm install" in the project directory.
 * Configure the necessary settings such as author etc in the config directory.
 * To run the script, execute "node main.js" in your terminal. Follow the instructions
 * printed in the terminal and scan the QR code using WhatsApp on your mobile device.
 *
 * Note: This script is for educational purposes only and demonstrates the underlying mechanics
 * of WhatsApp Web login. WhatsApp may have security measures in place to prevent unauthorized
 * access, so use this script at your own risk and only on accounts you own.
 */


// External Libraries
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const pino = require('pino');
const pretty = require('pino-pretty')
const { Boom } = require('@hapi/boom');
const spin = require('spinnies');
const { fromBuffer } = require('file-type');

// Baileys Library
const {
    default: makeWASocket,
    getBinaryNodeChildren,
    makeInMemoryStore,
    DisconnectReason,
    jidDecode,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    normalizeMessageContent,
    getBinaryNodeChild,
    makeCacheableSignalKeyStore,
    getContentType,
    Browsers,
    WA_DEFAULT_EPHEMERAL,
    generateWAMessage,
    DEFAULT_CONNECTION_CONFIG,
    getUrlInfo,
    isJidGroup
} = require('@whiskeysockets/baileys');

// Global Variables
global.baileys = require('@whiskeysockets/baileys');

// Internal Utilities
const {
    database,
    parseOptions,
    config: cfg,
    objDupl,
    arrDupl,
    writeFile,
    download,
    deleteDirectory
} = require('./utils');

// Internal Libraries
const senderType = require('./lib/senderType');
const { convert, toAudio, toVideo } = require('./lib/convert');
const { toFile } = require('qrcode');

// Logger 
const logger = pino(pretty({ colorize: true }));

// Initialize In-Memory Store
const store = makeInMemoryStore({
    logger: pino({ level: 'silent' })
})

// Initialize Global Database and Configuration
global.db = new database();
global.conf = new cfg();
global.reply = require('./config/response.json');
db.add('dashboard');
db.add('sessions');

// Attribute
const attribute = {
    command: new Map(),
    add: (x) => {
        attribute[x] = new Map();
    },
    lockfeature: new Map(),
};

// Cooldown, Cookies, and Settings Maps
const cooldown = new Map();
const cookies = new Map();
const queue = new Map();
global.settings = new Map();

// Regular Expression for URL Links
global.urlRegex = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;

// Create 'debug' directory if not exists
if (!fs.existsSync('debug')) fs.mkdirSync('debug');

// Read Features
const readFeatures = () => {
    const dir_ = path.join(__dirname, 'features');
    let features = fs.readdirSync(dir_);
    features.forEach(async (res) => {
        const categories = fs.readdirSync(`${dir_}/${res}`);
        for (const file of categories) {
            const command = require(`${dir_}/${res}/${file}`);
            if (typeof command.run != 'function') continue;
            const commandOptions = {
                name: 'command',
                alias: [],
                desc: '',
                usage: '',
                type: '',
                example: '',
                category: typeof categories.category === 'undefined' ? '' : res.toLowerCase(),
                wait: false,
                isDev: false,
                isOwner: true,
                isAdmin: false,
                option: false,
                isQuoted: false,
                selfAdmin: false,
                isGroup: false,
                isPrivate: false,
                query: false,
                queries: false,
                limit: false,
                cooldown: false,
                noPrefix: false,
                param: false,
                regex: false,
                message: {},
                mention: false,
                media: {
                    VideoMessage: false,
                    imageMessage: false,
                    stickerMessage: false,
                    documentMessage: false,
                    audioMessage: false,
                },
                isPremium: false,
                isProfessional: false,
                disable: false,
                optional: false,
                isUrl: false,
                run: () => { },
            };
            const cmd = parseOptions(commandOptions, command);
            let options = {};
            for (var i in cmd) {
                typeof cmd[i] === 'boolean' ? (options[i] = cmd[i]) : void 0;
                options[i] = cmd[i];
                const object = {
                    name: cmd.name,
                    alias: cmd.alias,
                    desc: cmd.desc,
                    use: cmd.use,
                    type: cmd.type,
                    category: cmd.category,
                    options,
                    run: cmd.run,
                };
                attribute.command.set(cmd.name, object);
            }
        }
    })
}
readFeatures();

// Session created listener
function ObservableSession() {
    // Create an empty JSON object
    const session = {};

    // Create an event handler to store update listener
    const updateListener = [];

    // Custom setter method for adding properties to the JSON object
    this.setProperty = (key, value) => {
        session[key] = value;
        // Trigger the update event
        updateListener.forEach(listener => listener(key, value));
    }

    // To add an update listener
    this.addUpdateListener = (listener) => {
        updateListener.push(listener)
    }

    // To remove an update listener
    this.removeUpdateListener = (listener) => {
        const index = updateListener.indexOf(listener);
        if (index !== -1) {
            updateListener.splice(index, 1);
        }
    }

    // The JSON itself
    this.session = session;
}

// Create the './temp' directory if it doesn't exist
if (!fs.existsSync('./temp')) {
    fs.mkdirSync('./temp');
}

// Sessions

if (!fs.existsSync('./sessions')) {
    fs.mkdirSync('./sessions');
}
const observables = new ObservableSession();
const sessions = db.read('sessions');
connectSession = async (filesession, user) => {
    connect(filesession, user);
}

// Connect to WhatsApp Websocket
const connect = async (filesession = './session', user = undefined) => {
    const starts = Date.now(); // Get the current timestamp

    // Log the start time in HH:mm:ss format
    const moment = require('moment');
    console.log('Start:', moment(starts).format('HH:mm:ss'));

    // Fetch the latest version of Baileys library
    const { version, isLatest } = await fetchLatestBaileysVersion();

    // Load or Create a multi-file authentication state (session)
    const { state, saveCreds } = await useMultiFileAuthState(filesession);

    const client = makeWASocket({
        printQRInTerminal: !user,
        // logger: pino({ level: 'silent' }),
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        qrTimeout: 60000,
        browser: Browsers.macOS(),
        getMessage: async key => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
        }
    })

    // Bind the 'client.ev' event to the 'store' object
    store.bind(client.ev);

    // Check if the 'store.json' file exists in the './database' directory
    // If it exists, read the data from the file into the 'store' object
    // If it doesn't exist, create an empty 'store.json' file
    if (fs.existsSync('./database/store.json')) {
        store.readFromFile('./database/store.json');
    } else {
        writeFile('./database/store.json', '{}');
    }

    // Periodically write the data from the 'store' object to the 'store.json' file every 10 seconds
    setInterval(() => {
        store.writeToFile('./database/store.json');
    }, 10_000);

    // Listen for the 'connection update' event triggered by the client
    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            // logger.error('Connection close due to ', lastDisconnect.error);
            if (reason === DisconnectReason.badSession) {
                if (!user) {
                    logger.error('Bad session detected. Please delete the session file and run the script again.');
                    client.logout();
                }
                else {
                    observables.setProperty(user, { message: 'Bad session file.' });
                    client.logout();
                }
            } else if (reason === DisconnectReason.connectionClosed) {
                if (!user) {
                    logger.error('Connection closed unexpectedly. Retrying...');
                    connect();
                }
                else {
                    observables.setProperty(user, { message: 'Connection closed unexpectedly. Retrying...' });
                    connect(filesession, user);
                }
            } else if (reason === DisconnectReason.connectionLost) {
                if (!user) {
                    logger.error('Connection lost. Check your internet connection. Retrying...');
                    setTimeout(() => {
                        connect();
                    }, 3000);
                }
                else {
                    observables.setProperty(user, { message: 'Connection lost.' });
                    client.end();
                }
            } else if (reason === DisconnectReason.connectionReplaced) {
                if (!user) {
                    logger.error('Connection replaced. Another new session has been opened. Exiting...');
                    process.exit(1);
                }
                else {
                    observables.setProperty(user, 'Connection replaced. Another new session has been opened.');
                    client.end();
                }
            } else if (reason === DisconnectReason.multideviceMismatch) {
                if (!user) {
                    logger.error('Multi-device mismatch error. Please rerun the script and scan the QR code again. Exiting...');
                    await deleteDirectory(filesession);
                    process.exit(1);
                }
                else {
                    observables.setProperty(user, { message: 'Multi-device mismatch error. Please scan the qr code again.' });
                    await deleteDirectory(filesession);
                    connect(filesession, user);
                }
            } else if (reason === DisconnectReason.loggedOut) {
                if (!user) {
                    logger.error('Device logged out. Please rerun the script and scan the QR code again. Exiting...');
                    await deleteDirectory(filesession);
                    process.exit(0);
                }
                else {
                    observables.setProperty(user, { message: 'Device logged out.' });
                    await deleteDirectory(filesession);
                    client.end();
                }
            } else if (reason === DisconnectReason.restartRequired) {
                if (!user) {
                    logger.info('Restart required. Restarting...');
                    connect(filesession, user);
                } else {
                    connect(filesession, user);
                }
            } else {
                if (!user) {
                    logger.error(`${lastDisconnect.error}`);
                    process.exit(0);
                }
                else {
                    observables.setProperty(user, { message: `${lastDisconnect.error}` })
                }
            }
        }
        else if (connection === 'open') {
            // Client sessions
            sessions.forEach((x, index) => {
                if (!x.active) {
                    const fss = `./sessions/${x.id.split('@')[0]}`;
                    connectSession(fss, x.id);
                    sessions[index]['active'] = true;
                }
            })
            observables.addUpdateListener(async (key, value) => {
                if (!value.qr) {
                    await client.sendMessage(key, { text: value.message });
                }
                else {
                    const filepath = `./temp/qrcode_${key}.png`;
                    toFile(filepath, value.qr, async (err) => {
                        if (err) {
                            return await client.sendMessage(key, { message: 'Failed to generate qrcode' });
                        }
                        else {
                            return await client.sendImage(key, filepath, 'To get started with our WhatsApp bot, please scan the QR code below using your WhatsApp app.');
                        }
                    })
                }
            })
        }
        if (qr !== undefined) {
            if (!user) {
                logger.info('Please scan the QR code using your WhatsApp app.');
            }
            else {
                observables.setProperty(user, { qr: qr });
            }
        }
    })

    client.ev.on('creds.update', async () => {
        await saveCreds();
    })

    /**
     *  Adds a message to the database.
     * @param {object} message - The message object to be added.
     * @param {string} type - The type of the message.
     * @returns {Promise} - A promise indicating the success of adding the message to the database.
     */
    client.addMessage = (message, type) => {
        // Use the db.modified function to update the database with the new message
        return db.modified('db', { id: message.key.id, message });
    }

    /**
     * Decodes a JID and returns a modified version based on the condition.
     * @param {string} jid - The JID to be decoded and modified.
     * @returns {string} - The decoded and possibly modified JID.
     */
    client.decodeJid = (jid) => {
        // Check if the JID contains a port number
        if (/:\d+@/gi.test(jid)) {
            // Decode the JID using jidDecode function
            const decode = jidDecode(jid);

            // Create a modified JID if user and server components are available, or use the original JID
            return ((decode.user && decode.server && `${decode.user}@${decode.server}`) || jid).trim();
        } else {
            // Return the original JID if it doesn't contain a port number
            return jid;
        }
    }

    /**
     * Retrieves the name of a contact or group based on the given WhatsApp JID.
     * @param {string} jid - The WhatsApp JID for which to retrieve the name.
     * @returns {Promise|string} - A promise that resolves to the name of the contact or group, or a string representing the name.
     */
    client.getName = (jid) => {
        // Decode the WhatsApp JID to get a potentially modified version
        const id = client.decodeJid(jid);
        let contact;

        // Check if the JID corresponds to a group
        if (id.endsWith('@g.us')) {
            return new Promise(async (resolve) => {
                contact = store.contacts[id] || {};

                // If the contact name or subject is not available, retrieve group metadata
                if (!(contact.name || contact.subject)) {
                    contact = await client.groupMetadata(jid) || {};
                }

                resolve(contact.name || contact.subject);
            });
        } else {
            // If the JID is not a group, handle different cases
            contact =
                id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : // Special case for WhatsApp
                    id === client.decodeJid(client.user.id) ? client.user : // Special case for the client's user
                        store.contacts[id] || {}; // Default case: retrieve contact details from store

            // Return the contact name, subject, or verified name
            return contact.name || contact.subject || contact.verifiedName;
        }
    }

    /**
     * Retrieves profile information for a given WhatsApp JID.
     * @param {string} jid - The WhatsApp JID for which to retrieve profile information.
     * @returns {Promise<object>} - A promise that resolves to an object containing profile information.
     */
    client.getProfile = async (jid) => {
        const result = {};

        // Fetch the status of the given JID
        await client.fetchStatus(jid)
            .then((x) => result.status = x)
            .catch(() => void 0);

        // Retrieve the profile picture URL for the given JID
        const pic = await client.profilePictureUrl(jid, 'image')
            .then((x) => result.profilePic = x)
            .catch(() => void 0);

        // If the status is empty, remove it from the result
        if (result.status && result.status.status === '') {
            delete result.status;
        }

        return result;
    }

    /**
     * Makes an HTTP GET request to a URL and returns the response data as an array buffer.
     * @param {string} url - The URL to make the GET request to.
     * @param {object} options - (Optional) Additional options for the Axios request.
     * @returns {Promise<Buffer|undefined>} - A promise that resolves to an array buffer containing the response data, or undefined in case of an error.
     */
    client.getBuffer = async (url, options = {}) => {
        try {
            // Use Axios to make an HTTP GET request
            const response = await require('axios')({
                method: 'get',
                url,
                headers: {
                    DNT: 1,
                    'Upgrade-Insecure-Request': 1,
                },
                responseType: 'arraybuffer',
                ...options,
            });

            // Return the response data as an array buffer
            return response.data;
        } catch (err) {
            // Log the error and return undefined
            logger.error(err);
            return;
        }
    }

    /**
     * Retrieves file data from various sources.
     * @param {Buffer|string} file - The file data or source to retrieve the file data from.
     * @param {boolean} asFile - Whether to save the file data as a temporary file if not already a file.
     * @returns {object} - An object containing information about the retrieved file data.
     */
    client.getFile = async (file, asFile) => {
        let response, filepath, data, filename;

        // Check if the input is already a buffer
        if (Buffer.isBuffer(file)) {
            data = file;
        }
        // Check if the input is a base64-encoded data URI
        else if (/^data:.*?\/.*?;base64,/i.test(file)) {
            data = Buffer.from(file.split(',')[1], 'base64');
        }
        // Check if the input is a URL
        else if (/^https?:\/\//.test(file)) {
            response = await fetch(file);
            data = await response.buffer();
        }
        // Check if the input is an existing local file path
        else if (fs.existsSync(file)) {
            filepath = file;
            data = fs.readFileSync(file);
        }
        // Check if the input is a string
        else if (typeof file === 'string') {
            data = file;
        } else {
            data = Buffer.alloc(0); // Default case
        }

        if (!Buffer.isBuffer(data)) {
            throw new TypeError('Result is not a buffer.');
        }

        // Determine the file type and extension
        let type = (await fromBuffer(data)) || {
            mime: 'application/octet-stream',
            ext: '.bin',
        };

        // Save as a temporary file if requested
        if (!filepath && data && asFile) {
            filepath = path.join('.', 'temp', `${Date.now()}.${type.ext}`);
            await fs.promises.writeFile(filepath, data);
        }

        // Extract filename from filepath if available
        if (filepath) {
            const explode = filepath.replace(/\\/, '/').split('/');
            filename = explode[explode.length - 1];
        }

        // Return an object containing information about the retrieved file data
        return {
            response,
            filepath,
            data,
            ...type,
            filename,
        };
    }

    /**
     * Sends a message to a specified JID with content and optional options.
     * @param {string} jid - The JID (contact or group ID) to which the message will be sent.
     * @param {object} content - The content of the message, including text, media, and more.
     * @param {object} options - (Optional) Additional options for the message.
     * @returns {object} - An object containing information about the sent message.
     */
    client.sendMessage = async (jid, content, options = {}) => {
        const userJid = state.creds?.me?.id;

        // Check if disappearingMessagesInChat is present in the content object
        if (typeof content === 'object' && 'disappearingMessagesInChat' in content && typeof content['disappearingMessagesInChat'] !== undefined && baileys.isJidGroup(jid)) {
            const { disappearingMessagesInChat } = content;
            const value = typeof disappearingMessagesInChat === 'boolean' ? (disappearingMessagesInChat ? WA_DEFAULT_EPHEMERAL : 0) : disappearingMessagesInChat;
            await client.groupToggleEphemeral(jid, value);
        }
        else {
            // Add mentions if "withTag" is specified in the content
            const text = content.text || content.caption || "";
            content.withTag ? (content.mentions = [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((value) => value[1] + "@s.whatsapp.net")) : void 0;

            // Generate the full message
            const fullMsg = await generateWAMessage(jid, content, {
                logger: DEFAULT_CONNECTION_CONFIG.logger,
                userJid,
                getUrlInfo: text => getUrlInfo(text, {
                    thumbnailWidth: 192,
                    fetchOpts: { timeout: 3000 },
                    logger: DEFAULT_CONNECTION_CONFIG.logger,
                    uploadImage: client.waUploadToServer
                }),
                upload: client.waUploadToServer,
                ...options
            });

            // Handle edit and delete messages
            const isDeleteMsg = 'delete' in content && !!content.delete;
            const isEditMsg = 'edit' in content && !!content.edit;
            const additionalAttributes = {};
            if (isDeleteMsg) {
                if (isJidGroup(content.delete?.remoteJid) && !content.delete?.fromMe) {
                    additionalAttributes.edit = '8';
                } else {
                    additionalAttributes.edit = '7';
                }
            } else if (isEditMsg) {
                additionalAttributes.edit = '1';
            }
            await client.relayMessage(jid, fullMsg.message, {
                messageId: fullMsg.key.id,
                cachedGroupMetadata: options.cachedGroupMetadata,
                statusJidList: options.statusJidList,
                additionalAttributes
            })
            process.nextTick(() => {
                client.ev.emit('messages.upsert', {
                    messages: [fullMsg],
                    type: 'append'
                })
            });
            return fullMsg;
        }
    }

    /**
     * Generates header information by retrieving title and thumbnail from a web page.
     * @param {string} url - The URL of the web page to fetch header information from.
     * @returns {Promise<object>} - A promise that resolves to an object containing the title and thumbnail URL.
     */
    client.generateHeader = async (url) => {
        // Create a JSDOM instance to parse the web page
        const dom = await JSDOM.fromURL(url);
        let img;

        // Iterate through all img elements on the page and look for thumbnail image hosted on pps.whatsapp.net
        dom.window.document.querySelectorAll('img').forEach((x) => {
            if (x.src.includes('pps.whatsapp.net')) img = x.src;
        });

        // Get the title of the web page or use a default title
        const title = dom.window.document.title || 'Advertiserment';

        // Return an object containing the title and thumbnail URL
        return { title, thumbnail: img };
    }

    /**
     * Sends a contact card (vCard) with contact information to a specified JID.
     * @param {string} jid - The JID (contact or group ID) to which the contact card will be sent.
     * @param {string|string[]} numbers - The phone number(s) for the contact. Can be a single number or an array of numbers.
     * @param {object} quoted - The message that is being quoted (if any).
     * @param {object} options - (Optional) Additional options for the message.
     * @returns {object} - An object containing information about the sent contact card message.
     */
    client.sendContact = async (jid, numbers, quoted, options = {}) => {
        let vcard = [];

        if (Array.isArray(numbers)) {
            // Send multiple contacts
            for (let number of numbers) {
                let card = 'BEGIN:VCARD\nVERSION:3.0\n';

                // Retrieve the name for the contact
                const name = await client.getName(number + '@s.whatsapp.net') || 'Unknown Contact';
                card += `N:${name}\nFN:${name}\n`;

                // Add phone number to the contact card
                card += `item1.tel;waid=${number}:${number}\nitem1.X-ABLabel:Number\n`;

                card += 'END:VCARD';
                vcard.push({
                    displayName: name,
                    vcard: card,
                });
            }

            // Generate display name for the contact card
            let fname = await client.getName(numbers[0] + `@s.whatsapp.net`);
            const display = vcard.length === 1 ? fname : `${fname} and ${vcard.length} other contacts`;

            // Send the message with the contact card(s)
            return client.sendMessage(jid, {
                contacts: {
                    displayName: display,
                    contacts: vcard,
                },
                ...options,
            }, { quoted });
        } else if (typeof numbers === 'object') {
            // Send a single contact

            // Generate the vCard content
            let card = 'BEGIN:VCARD\nVERSION:3.0\n';
            const name = numbers.name ? numbers.name : (await client.getName(numbers.number + '@s.whatsapp.net'));
            card += `N:${name}\nFN:${name}\n`;
            card += `item1.tel;waid=${numbers.number}:${numbers.number}\nitem1.X-ABLabel:Number\n`;

            // Add email and Instagram if available
            numbers.email ? (card += `item2.EMAIL;type=INTERNET:${numbers.email}\nitem2.X-ABLabel:Email\n`) : void 0;
            numbers.instagram ? (card += `item3.URL:${numbers.instagram}\nitem3.X-ABLabel:Instagram\n`) : void 0;

            card += 'END:VCARD';
            vcard.push({
                displayName: name,
                vcard: card,
            });

            // Send the message with the contact card
            return await client.sendMessage(jid, {
                contacts: {
                    displayName: name,
                    contacts: vcard,
                },
                ...options,
            }, { quoted });
        }
    }

    /**
     * Sends media (image, video, audio, document, sticker) to a specified JID.
     * @param {string} jid - The JID (contact or group ID) to which the media will be sent.
     * @param {string} path - The path to the media file on the local filesystem.
     * @param {string} caption - The caption or description for the media.
     * @param {object} quoted - The message that is being quoted (if any).
     * @param {boolean} ptt - Whether the media is a voice note (if applicable).
     * @param {object} options - (Optional) Additional options for the message.
     */
    client.sendMedia = async (jid, path, caption = '', quoted, ptt = false, options = {}) => {
        // Get the file details using the getFile function
        const file_ = await client.getFile(path, true);
        let { res, data: file, filepath, filename, mime: mimetype } = file_;

        // Check if the response status is not 200 or if the file is too small
        if ((res && res.status !== 200) || file.length <= 65536) {
            try {
                throw { json: JSON.parse(file.toString()) };
            } catch (err) {
                if (err.json) throw err.json;
            }
        }

        let opt = { filename };
        if (quoted) opt.quoted = quoted;

        // Check the media type based on the mimetype
        let mtype;
        if (/webp/.test(mimetype)) mtype = 'sticker';
        if (/image/.test(mimetype)) mtype = 'image';
        if (/video/.test(mimetype)) mtype = 'video';
        if (/audio/.test(mimetype)) mtype = 'audio';
        if (!mtype) mtype = 'document';

        // Send the media message
        client.sendMessage(jid, {
            ...options,
            caption,
            ptt,
            filename,
            [mtype]: { url: filepath },
            mimetype,
        }, { ...opt, ...options }).then(() => fs.existsSync(filepath) && fs.unlinkSync(filepath));
    }

    /**
     * Sends an audio file to a specified JID.
     * @param {string} jid - The JID (contact or group ID) to which the audio will be sent.
     * @param {string|Buffer} filepath - The file path or buffer of the audio file.
     * @param {object} quoted - The message that is being quoted (if any).
     * @param {object} options - (Optional) Additional options for the message.
     * @returns {Promise<object>} - A promise that resolves to an object containing information about the sent audio message.
     */
    client.sendAudio = async (jid, filepath, quoted, options = {}) => {
        // Resolve the file path if provided as a relative path
        filepath = fs.existsSync(filepath) ? path.resolve(filepath) : filepath;

        // Read the audio content as a buffer
        let buff = Buffer.isBuffer(filepath) ? filepath : fs.existsSync(filepath) ? fs.readFileSync(filepath) : await client.getBuffer(filepath);

        // Determine the file type from the buffer content
        let type = await fromBuffer(buff);

        // Convert audio format to mp3 if not already in mp3 format
        const content = type.ext !== 'mp3' ? await toAudio(filepath, type.ext, 'mp3') : buff;

        // Delete temporary audio file if it was created
        fs.existsSync(filepath) && fs.unlinkSync(filepath);

        // Extract file information
        const file = await fromBuffer(content);

        // Send the audio message
        return await client.sendMessage(jid, {
            audio: content,
            filename: Date.now() / 1000 + file.ext,
            mimetype: file.mime,
        }, { quoted });
    }

    /**
     * Sends a video file to a specified JID.
     * @param {string} jid - The JID (contact or group ID) to which the video will be sent.
     * @param {string|Buffer} filepath - The file path or buffer of the video file.
     * @param {string} caption - The caption or description for the video.
     * @param {object} quoted - The message that is being quoted (if any).
     * @param {object} options - (Optional) Additional options for the message.
     * @returns {Promise<object>} - A promise that resolves to an object containing information about the sent video message.
     */
    client.sendVideo = async (jid, filepath, caption = '', quoted, options = {}) => {
        // Resolve the file path if provided as a relative path
        filepath = fs.existsSync(filepath) ? path.resolve(filepath) : filepath;

        // Read the video content as a buffer
        let buff = Buffer.isBuffer(filepath) ? filepath : fs.existsSync(filepath) ? fs.readFileSync(filepath) : (await client.getFile(filepath)).data;

        // Determine the file type from the buffer content
        let type = await fromBuffer(buff);

        // Convert video format to mp4 if not already in mp4 format
        const content = type.ext !== 'mp4' ? await toVideo(filepath, type.ext) : buff;

        // Delete temporary video file if it was created
        fs.existsSync(filepath) && fs.unlinkSync(filepath);

        // Extract file information
        const file = await fromBuffer(content);

        // Send the video message
        return await client.sendMessage(jid, {
            video: content,
            mimetype: file.mime,
            caption,
            gifPlayBack: true,
            ...options
        }, { quoted });
    }

    /**
     * Sends an image file to a specified JID.
     * @param {string} jid - The JID (contact or group ID) to which the image will be sent.
     * @param {string|Buffer} filepath - The file path or buffer of the image file.
     * @param {string} caption - The caption or description for the image.
     * @param {object} quoted - The message that is being quoted (if any).
     * @param {object} options - (Optional) Additional options for the message.
     * @returns {Promise<object>} - A promise that resolves to an object containing information about the sent image message.
     */
    client.sendImage = async (jid, filepath, caption = '', quoted, options = {}) => {
        // Resolve the file path if provided as a relative path
        filepath = fs.existsSync(filepath) ? path.resolve(filepath) : filepath;

        // Read the image content as a buffer
        let buff = Buffer.isBuffer(filepath) ? filepath : fs.existsSync(filepath) ? fs.readFileSync(filepath) : (await client.getFile(filepath)).data;

        // Determine the file type from the buffer content
        let type = await fromBuffer(buff);

        // Send the image message
        return await client.sendMessage(jid, {
            image: buff,
            caption,
            mimetype: type.mime,
            ...options
        }, { quoted });
    }

    /**
     * Sends a group invitation message to a participant.
     * @param {string} jid - The JID of the group to which the invitation is being sent.
     * @param {string} participant - The JID of the participant who will receive the invitation.
     * @param {string} inviteCode - The invitation code for the group.
     * @param {number} inviteExpiration - The expiration timestamp for the invitation (optional).
     * @param {string} groupName - The name of the group (optional).
     * @param {Buffer} jpegThumbnail - The JPEG thumbnail for the invitation (optional).
     * @param {string} caption - The caption for the invitation message.
     * @param {object} options - (Optional) Additional options for the message.
     * @returns {Promise<object>} - A promise that resolves to an object containing information about the sent invitation message.
     */
    client.sendGroupInvite = async (jid, participant, inviteCode, inviteExpiration, groupName, jpegThumbnail, caption = 'Invitation to my group WhatsApp', options = {}) => {
        let profilePic;

        // Get the profile picture URL of the group
        await client.profilePictureUrl(jid).then((x) => profilePic = x).catch(() => void 0);

        // Convert thumbnail to buffer if it's not already
        jpegThumbnail = Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : profilePic && await client.getBuffer(profilePic);

        // Create a group invitation message
        let msg = baileys.proto.Message.fromObject({
            groupInviteMessage: baileys.proto.Message.GroupInviteMessage.fromObject({
                inviteCode,
                inviteExpiration: inviteExpiration ? parseInt(inviteExpiration) : +new Date(new Date() + (3 * 86400000)),
                groupJid: jid,
                groupName: groupName ? groupName : (await client.extractGroupMetadataJid(jid)).subject,
                jpegThumbnail,
                caption,
            }),
        });

        // Generate the WAMessage content
        const _ = baileys.generateWAMessageFromContent(participant, msg, options);

        // Relay the invitation message to the participant
        await client.relayMessage(participant, _.message, { messageId: _.key.id });

        return _;
    }

    /**
     * Extracts group metadata from a provided code.
     * @param {string} code - The code from which to extract group metadata.
     * @returns {object} - An object containing extracted group metadata.
     */
    client.extractGroupMetadataCode = (code) => {
        // Get the binary node child with tag 'group'
        const group = getBinaryNodeChild(code, 'group');

        // Extract participant information
        const participant = group.content.filter((x) => x.tag === 'participant').map((x) => x.attrs);

        // Extract subject, subject owner, and subject timestamp
        const subject = group.attrs.subject || 'No subject';
        const s_o = group.attrs && group.attrs.s_o || 'Unknown subject owner';
        const s_t = group.attrs && group.attrs.s_t || 'Unknown subject timestamp';

        // Extract description, description ID, description owner, and description timestamp
        const desc_ = group.content.find((index) => index.tag === 'description');
        let desc, descid, d_o, d_t;
        if (desc_.content) {
            let body = desc_.content.find((key) => key.tag === 'body');
            desc = body.content ? body.content : void 0;
            descid = desc_.attrs.id;
            d_o = desc_.attrs.participant;
            d_t = desc_.attrs.t;
        }

        // Extract group ID, creator, and creation timestamp
        const groupid = group.attrs.id.includes('@') ? group.attrs.id : `${group.attrs.id}@g.us`;
        let _c, _t;
        if (groupid.includes('-')) {
            const split = groupid.replace('@g.us', '').split('-');
            _c = split[0] + '@s.whatsapp.net';
            _t = split[1];
        }

        // Construct and return the extracted metadata
        const data = {
            id: groupid,
            subject,
            creator: group.attrs.creator || _c || 'No creator',
            creation: group.attrs.creation || _t || 'No creation',
            participant,
            desc,
            descid,
            d_t,
            d_o,
            s_t,
            s_o,
        };
        return data;
    }

    /**
     * Checks the validity of a group invite code.
     * @param {string} code - The group invite code to check.
     * @returns {Promise<object|undefined>} - A promise that resolves to an object with information about the group if the code is valid, or undefined if invalid.
     */
    client.checkInviteCode = async (code) => {
        // Send an IQ request to check the invite code
        return client.query({
            tag: 'iq',
            attrs: {
                type: 'get',
                xmlns: 'w:g2',
                to: '@g.us',
            },
            content: [{ tag: 'invite', attrs: { code } }],
        })
            .then((x) => { return x; })
            .catch(() => { return; });
    }

    /**
     * Extracts metadata from a group using its JID.
     * @param {string} jid - The JID of the group for which to extract metadata.
     * @returns {Promise<object|undefined>} - A promise that resolves to an object containing extracted metadata if successful, or undefined if an error occurs.
     */
    client.extractGroupMetadataJid = async (jid) => {
        // Send an IQ request to extract group metadata using the provided JID
        return client.query({
            tag: 'iq',
            attrs: {
                type: 'get',
                xmlns: 'w:g2',
                to: jid,
            },
            content: [{
                tag: 'query',
                attrs: {
                    request: 'interactive',
                },
            }],
        })
            .then((x) => {
                let _t;
                const content = x.content.find((x) => x.content);

                // Extract subject, subject owner, and subject timestamp
                const subject = content.attrs && content.attrs.subject || 'Unknown Subject';
                const s_o = content.attrs && content.attrs.s_o || 'Unknown subject owner';
                const s_t = content.attrs && content.attrs.s_t || 'Unknown subject timestamp';

                // Extract creator and creation timestamp
                let creator = content.attrs && content.attrs.creator;
                if (!creator && jid.includes('-')) {
                    const split = jid.replace('@g.us', '').split('-');
                    creator = split[0];
                    _t = split[1];
                }
                const creation = content.attrs && content.attrs.creation || _t || 'Unknown creation timestamp';

                // Extract description and its attributes
                const _desc = content.content.find((x) => x.tag === 'description');
                const d_o = _desc.attrs && _desc.attrs.participant;
                const descid = _desc.attrs.id;
                const d_t = _desc.attrs.t;
                const desc = _desc.content && _desc.content.find((x) => x.tag === 'body').content;

                // Extract participant information
                const participant = content.content.filter((x) => x.tag === 'participant').map((x) => x.attrs);

                // Check if the group is locked or has an announcement
                const locked = content.content.find((x) => x.tag === 'locked') && true;
                const announcement = content.content.find((x) => x.tag === 'announcement') && true;

                // Construct and return the extracted metadata
                return {
                    subject,
                    s_o,
                    s_t,
                    creator,
                    creation,
                    d_o,
                    d_t,
                    descid,
                    desc,
                    participant,
                    announcement,
                    locked,
                };
            })
            .catch((x) => void 0);
    }

    /**
     * Generates a message content object based on the provided message and forward information.
     * @param {object} message - The message to generate the content from.
     * @param {number} forward - The forwarding score for the message, if forwarding.
     * @returns {Promise<object>} - A promise that resolves to the generated message content object.
     */
    client.generateMessage = async (message, forward) => {
        let content = message.message;

        // Normalize and encode the message content
        if (!content) return;
        content = normalizeMessageContent(content);
        content = baileys.proto.Message.decode(baileys.proto.Message.encode(content).finish());

        let key = Object.keys(content)[0];

        // Restructure the content for conversation and extendedTextMessage cases
        if (key === 'conversation') {
            content.extendedTextMessage = { text: content[key] };
            delete content.conversation;
            key = 'extendedTextMessage';
        }

        // Attach forward information to the content if forwarding
        forward ? (content[key].contextInfo = { forwardingScore: forward, isForwarded: true }) : void 0;

        return content;
    }

    /**
     * Adds participants to a group using JID.
     * @param {string} jid - The JID of the group to which participants will be added.
     * @param {Array<string>} participant - An array of JIDs of participants to be added to the group.
     * @returns {Promise<Array<object>>} - A promise that resolves to an array of objects representing the status of the participant additions.
     */
    client.groupParticipantsAdd = async (jid, participant) => {
        // Send an IQ request to add participants to the group
        const response = await client.query({
            tag: 'iq',
            attrs: {
                type: 'set',
                xmlns: 'w:g2',
                to: jid,
            },
            content: [{
                tag: 'add',
                attrs: {},
                content: participant.map(jid => ({
                    tag: 'participant',
                    attrs: { jid }
                }))
            }]
        });

        // Extract information about affected participants from the response
        const node = getBinaryNodeChild(response, 'add');
        const affected = getBinaryNodeChildren(node, 'participant');
        return affected.map((value) => {
            return {
                status: value.attrs.error || '200',
                jid: value.attrs.jid,
                invite: value.attrs.error && value.content ? value.content.find((value) => value.tag === "add_request").attrs : void 0
            };
        });
    }

    /**
     * Serializes and processes a WhatsApp message content for easy access and interaction.
     * @param {object} client - The WhatsApp client instance.
     * @param {object} content - The message content to be processed.
     * @returns {object|undefined} - The processed message object or undefined if no content.
     */
    client.serialize = async (client, content) => {
        // Ensure there's content to process
        if (!content) return;

        // Deep copy the content object
        let message = JSON.parse(JSON.stringify(content));

        // Extract key details from the message
        if (message.key) {
            // Set the ID of the message based on the key
            message.id = message.key.id;

            // Determine if the message is sent by the current user
            message.self = message.key.fromMe;

            // Set the sender and recipient of the message based on the key
            message.from = message.key.remoteJid;

            // Determine if the message is sent in a group chat
            message.isGroup = message.from.endsWith('@g.us');

            // Determine the sender of the message based on the chat type
            message.sender = message.isGroup
                ? client.decodeJid(message.key.participant) // If group chat, decode participant JID
                : message.self
                    ? client.decodeJid(client.user.id) // If sent by self, use user ID
                    : message.from; // Otherwise, use sender JID

            // Initialize the view_once flag as false (it can be updated later if applicable)
            message.view_once = false;

            // Check if the message contains any content
            if (message.message) {
                // Determine the type of content in the message
                message.type = getContentType(message.message);

                // Check if the content type is 'ephemeralMessage'
                if (message.type === 'ephemeralMessage') {
                    // Extract the actual message from the 'ephemeralMessage' content
                    message.message = message.message[message.type].message;

                    // Update the content type based on the extracted message
                    message.type = getContentType(message.message);

                    // You can continue to process the updated message content based on the new content type
                    // For example, you might have additional logic to handle 'imageMessage', 'videoMessage', etc.
                }

                // Check if the content type is 'viewOnceMessage'
                if (message.type === 'viewOnceMessage') {
                    // Extract the specific viewOnce message type (e.g., 'imageMessage', 'videoMessage', etc.)
                    const vtype = Object.keys(message.message[message.type].message)[0];

                    // Remove the 'viewOnce' property from the extracted viewOnce message
                    delete message.message[message.type].message[vtype].viewOnce;

                    // Update the message content to the extracted viewOnce message content
                    message.message = {
                        ...message.message[message.type].message,
                    };

                    // Update the content type based on the updated message content
                    message.type = getContentType(message.message);

                    // Set the 'view_once' flag to true
                    message.view_once = true;

                    // You can continue to process the updated message content based on the new content type
                    // For example, you might have additional logic to handle 'imageMessage', 'videoMessage', etc.
                }

                // Extract the content types from the keys of the 'message' object
                message.mtype = Object.keys(message.message).filter((x) =>
                    x.includes('Message') || x.includes('conversation')
                )

                try {
                    // Try to extract mentionedJid from the contextInfo of the specific content type
                    message.mentions = message.message[message.type].contextInfo?.mentionedJid || [];
                } catch {
                    // If contextInfo doesn't exist or the extraction fails, set 'mentions' to an empty array
                    message.mentions = [];
                }

                try {
                    // Extract the contextInfo of the quoted message from the specific content type
                    const quoted = message.message[message.type].contextInfo;

                    if (quoted.quotedMessage.ephemeralMessage) {
                        // If the quoted message is an ephemeralMessage, determine its type
                        quotedType = (x) =>
                            Object.keys(quoted.quotedMessage.ephemeralMessage.message).find((key) => key === x);

                        if (quotedType('viewOnceMessage')) {
                            // If the ephemeral message is also a viewOnceMessage, create a 'view_once' quoted object
                            message.quoted = {
                                type: 'view_once',
                                stanzaId: quoted.stanzaId,
                                sender: client.decodeJid(quoted.participant),
                                message: quoted.quotedMessage.ephemeralMessage.message.viewOnceMessage.message,
                            };
                        } else {
                            // If the ephemeral message is not a viewOnceMessage, create a 'ephemeral' quoted object
                            message.quoted = {
                                type: 'ephemeral',
                                stanzaId: quoted.stanzaId,
                                sender: client.decodeJid(quoted.participant),
                                message: quoted.quotedMessage.ephemeralMessage.message,
                            };
                        }
                    } else if (quoted.quotedMessage.viewOnceMessage) {
                        // If the quoted message is a viewOnceMessage, create a 'view_once' quoted object
                        message.quoted = {
                            type: 'view_once',
                            stanzaId: quoted.stanzaId,
                            sender: client.decodeJid(quoted.participant),
                            message: quoted.quotedMessage.viewOnceMessage.message,
                        };
                    } else {
                        // If the quoted message is neither ephemeral nor viewOnce, create a 'normal' quoted object
                        message.quoted = {
                            type: 'normal',
                            stanzaId: quoted.stanzaId,
                            sender: client.decodeJid(quoted.participant),
                            message: quoted.quotedMessage,
                        };
                    }

                    // 
                    const qtype = Object.keys(quoted.quotedMessage)[0];

                    // Extract mentionedJid from contextInfo
                    message.quoted.mentions = quoted.quotedMessage[qtype].contextInfo?.mentionedJid || [];

                    // Determine if the sender of the quoted message is the same as the current user
                    message.quoted.self = message.quoted.sender === client.decodeJid(client.user.id);

                    // Determine the message type of the quoted message
                    message.quoted.mtype = Object.keys(message.quoted.message).filter((x) => {
                        return x.includes('Message') || x.includes('conversation');
                    })[0];

                    // Extract the text content of the quoted message
                    message.quoted.text = message.quoted.message.conversation ||
                        message.quoted.message[message.quoted.mtype].text ||
                        message.quoted.message[message.quoted.mtype].description ||
                        message.quoted.message[message.quoted.mtype].caption ||
                        (message.quoted.mtype === 'templateButtonReplyMessage' && message.quoted.message[message.quoted.mtype].hydratedTemplate['hydratedContentText']) ||
                        '';

                    // Set the ID of the quoted message
                    message.quoted.id = message.quoted.stanzaId;

                    // Create a key object for the quoted message
                    message.quoted.key = {
                        id: message.quoted.stanzaId,
                        fromMe: message.quoted.self,
                        remoteJid: message.from,
                        participant: message.quoted.sender,
                    };

                    // Define a method to delete the quoted message
                    message.quoted.delete = () => client.sendMessage(client, { delete: message.quoted.key });

                    // Define a method to download the quoted message
                    message.quoted.download = (path) => download(message.quoted.message, path);
                } catch (e) {
                    // logger.error(e);
                }
                // Try to extract the main text content of the message
                try {
                    message.body = message.message.conversation ||
                        message.message[message.type].caption ||
                        message.message[message.type].text ||
                        (message.type === 'listResponseMessage' && message.message[message.type].singleSelectReply.selectedRowId) ||
                        (message.type === 'buttonsResponseMessage' && message.message[message.type].selectedButtonId) ||
                        (message.type === 'templateButtonReplyMessage' && message.message[message.type].selectedId) ||
                        (message.type === 'messageContextInfo' && (message.message.buttonsResponseMessage?.selectedButtonId || message.message?.listResponseMessage.singleSelectReply.selectedRowId)) || '';
                } catch (e) {
                    // If there's an error, set the body to an empty string
                    message.body = '';
                }
                // Define a function to get the quoted message object from the database
                message.getQuotedObj = async () => {
                    // If there's no stanzaId for the quoted message, return false
                    if (!message.quoted.stanzaId) return false;

                    // Load the quoted message from the database using the store's loadMessage method
                    let query = await store.loadMessage(message.from, message.quoted.stanzaId, client) || {};

                    // Serialize the loaded message object using client.serialize
                    return await client.serialize(client, query);
                };

                // Define a function to reply to the current message
                message.reply = async (text, options = {}) => {
                    // Use the client's sendMessage method to send a reply message
                    return client.sendMessage(message.from, {
                        text, ...options,
                    }, { quoted: message, ...options });
                };

                // Define a function to delete the current message
                message.delete = () => client.sendMessage(message.from, { delete: message.key });

                // Define a function to download the media attached to the current message
                message.download = (path) => download(message.message, path);
            }
            return message;
        } else return;
    }

    /**
     *  Determine the type of a given message.
     * @param {object} message - The message object to determine the type for.
     * @returns {string|undefined} The determined message type or undefined if not recognized.
     */
    client.messageTypes = (message) => {
        // Retrieve the 'type' property from the message object
        const { type } = message;

        // Convert the message object to JSON string to check its content
        const content = JSON.stringify(message);

        // Check for specific message types based on their content or 'type' property
        // and return the corresponding message type
        if (content.includes('imageMessage') || type === 'imageMessage') {
            return 'imageMessage';
        }
        if (content.includes('stickerMessage') || type === 'stickerMessage') {
            return 'stickerMessage';
        }
        if (content.includes('videoMessage') || type === 'videoMessage') {
            return 'videoMessage';
        }
        if (content.includes('audioMessage') || type === 'audioMessage') {
            return 'audioMessage';
        }
        if (content.includes('documentMessage') || type === 'documentMessage') {
            return 'documentMessage';
        } else {
            // If the message type is not recognized, return undefined
            return;
        }
    }

    /**
     * Extracts group metadata and related information for a given group JID and sender JID.
     *
     * @param {string} jid - The JID of the group.
     * @param {string} sender - The JID of the sender.
     * @returns {object} An object containing extracted group metadata and related information.
     * - groupMetadata: The extracted group metadata.
     * - groupSubject: The subject of the group.
     * - groupAdmins: A function to check if a given JID is an admin of the group.
     * - isAdmin: Whether the sender is an admin of the group.
     * - selfAdmin: Whether the bot is an admin of the group.
     */
    client.groupMetadataFrom = async (jid, sender) => {
        // Extract group metadata using the provided function
        const groupMetadata = await client.extractGroupMetadataJid(jid) || {};

        // Extract group subject from the metadata
        const groupSubject = groupMetadata.subject;

        // Function to check if a given JID is an admin of the group
        const groupAdmins = (x) =>
            groupMetadata.participant.find(
                (y) => y.jid === x && (y.type === 'admin' || y.type === 'superadmin')
            );

        // Check if the sender and the bot are admins of the group
        const isAdmin = groupAdmins(sender);
        const selfAdmin = groupAdmins(client.decodeJid(client.user.id));

        // Return an object containing extracted group metadata and related information
        return {
            groupMetadata,
            groupSubject,
            groupAdmins,
            isAdmin,
            selfAdmin,
        };
    }

    /**
     * Execute a command based on the provided options and message context.
     *
     * @param {object} client - The WhatsApp client instance.
     * @param {object} message - The incoming message object.
     * @param {object} options - Options for executing the command.
     * @param {string} options.exec - The name of the command to execute.
     * @param {string} options.command - The command extracted from the message body.
     * @param {string} options.arg - The first argument of the command.
     * @param {Array} options.args - Array of arguments of the command.
     * @param {string} options.query - The query extracted from the message body.
     * @param {string} options.prefix - The command prefix used.
     * @param {string} options.response - The response to be sent.
     * @param {Array} options.explode - Array of exploded command parts.
     * @returns {Promise} A Promise that resolves when the command execution is done.
     */
    client.execute = async (client, message, { exec, command, arg, args, query, prefix, response, explode }) => {
        // Destructuring properties from the message object
        const { isGroup, sender, from, isPrivate } = message;

        // Initialize variables related to group information
        groupMetadata = undefined, groupSubject = undefined, groupAdmins = undefined, isAdmin = undefined, selfAdmin = undefined;

        // Determine the value of the 'queries' variable based on the provided options
        const queries = !!query ? query : message.quoted && message.quoted.text || '';

        // Check if the sender is a developer (based on the 'dev' status)
        global.isDev = conf.check('dev', sender, 'jid');

        // Check if the sender is owner (based on the 'owner' status)
        global.isOwner = conf.check('owner', sender, 'jid');

        // Set global variables to indicate premium and professional user status
        global.isPremium = senderType.getPremiumUser(sender);
        global.isProfessional = senderType.getProfessionalUser(sender);

        // Define the 'username' variable based on whether the message is from a group or private chat
        const username = !isGroup ? message.pushName : void 0;

        // Read the 'dev.json' file to get developer-related information
        const dev = JSON.parse(fs.readFileSync('./config/dev.json'));

        // Determine the mentioned participant: quoted message sender, mentioned participant, or sender if not in a group
        mentioned = message.quoted ? [message.quoted.sender] : message.mentions || (!isGroup ? message.from : []);

        // Retrieve the command object based on the provided execution command or its aliases
        const cmd = attribute.command.get(exec.toLowerCase()) ||
            [...attribute.command.values()].find((x) => x.alias.find((x) => x.toLowerCase() === exec.toLowerCase())) ||
            attribute.command.get(exec) || [...attribute.command.values()].find((x) => x.alias.find((x) => x === exec));

        // Command name & aliases
        const aliases = [cmd.name, ...cmd.alias];

        // If no valid command object is found, return early
        if (!cmd) return;

        // Ensure there's a Map for cooldowns associated with the sender
        if (!cooldown.has(sender)) cooldown.set(sender, new Map);

        // Create a new Map for cookies if it doesn't exist for the 'from' value
        var cookie = new Map();
        if (!cookies.has(from)) cookies.set(from, cookie);

        // Get the current timestamp
        const now = Date.now();

        // Retrieve the cooldown timestamps for the sender
        const timestamps = cooldown.get(sender);

        // Check if the execution command is locked and prevent its use if locked
        if (attribute.lockfeature.get(exec.toLowerCase())) {
            return await client.sendMessage(message.from, { text: reply.disabled }, { quoted: message });
        }

        // Set the current timestamp as a cooldown for the sender if the command has a cooldown option
        if (cmd.options.cooldown) {
            timestamps.set(sender, now);
        }

        // Check if the command is designated for private messages and return an error if used in a group context
        if (cmd.options.isPrivate && !isPrivate) {
            return await client.sendMessage(message.from, { text: reply.onlyPM }, { quoted: message });
        }

        // Check if the command is designated for group chats and return an error if used in a private context
        if (cmd.options.isGroup && !isGroup) {
            return await client.sendMessage(message.from, { text: reply.OnlyGroups }, { quoted: message });
        }

        // Check if the command requires admin privileges or self admin privileges within a group
        if (cmd.options.isAdmin || cmd.options.selfAdmin && isGroup) {
            var { groupMetadata, groupSubject, groupAdmins, isAdmin, selfAdmin } = await client.groupMetadataFrom(from, sender);
            if (cmd.options.isAdmin && !isAdmin) {
                return await client.sendMessage(message.from, { text: reply.OnlyAdmins }, { quoted: message });
            }
            if (cmd.options.selfAdmin && !selfAdmin) {
                return await client.sendMessage(message.from, { text: reply.selfAdmin }, { quoted: message });
            }
        }

        // Check if the command requires developer privileges and return an error if not a developer or self
        if (cmd.options.isDev && !isDev && !message.self) {
            return client.sendMessage(message.from, { text: reply.OnlyDeveloper }, { quoted: message });
        }

        // Check if the command requires premium privileges and return an error if not premium or professional or a developer
        if (cmd.options.isPremium && !isPremium && !isProfessional && !isDev && !message.self && !isOwner) {
            return await client.sendMessage(message.from, { text: reply.OnlyPre }, { quoted: message });
        }

        // Check if the command requires professional privileges and return an error if not professional or a developer
        if (cmd.options.isProfessional && !isProfessional && !isDev && !message.self && !isOwner) {
            return await client.sendMessage(message.from, { text: reply.OnlyPro }, { quoted: message });
        }

        // Check if the command has a limit and handle limit enforcement
        if (cmd.options.limit && !isDev && !message.self && !isOwner) {
            var limit = typeof cmd.options.limit === 'number' ? cmd.options.limit : 20;
            const limitBalance = db.check('limit', message.sender, 'id');
            var data = limitBalance || (_a = { id: message.sender }, _a[cmd.name] = limit) && _a;
            if (data[cmd.name] >= 1 === false) {
                return await client.sendMessage(message.from, { text: `${reply.reachedLimit} ${isProfessional ? '' : isPremium ? reply.upgradePro : reply.upgradePrem}` }, { quoted: message });
            }
            const balance = data[cmd.name] ? data[cmd.name] -= 1 : data[cmd.name] = limit - 1;
            limitBalance ? db.replace('limit', data, message.sender, 'id') : db.modified('limit', data);
        }

        // Check if the command requires a quoted message and return an error if no quoted message is present
        if (cmd.options.isQuoted && !message.quoted) {
            return await client.sendMessage(message.from, { text: reply.reply }, { quoted: message });
        }

        // Check if the command requires specific media types and handle validation
        if (cmd.options.media && Object.keys(cmd.options.media).find((x) => cmd.options.media[x])) {
            let requiredType = [], mdType = client.messageTypes(message) || {};
            Object.keys(cmd.options.media).forEach((x) => {
                if (cmd.options.media[x]) requiredType.push(x);
            })

            // Check if the provided media type matches any of the required types
            if (!requiredType.includes(mdType)) {
                let requiredTypeMessage;
                if (requiredType.length === 1) {
                    requiredTypeMessage = `Kindly reply or send any ${requiredType[0].replace(/Message/, '')}, please.`;
                } else {
                    requiredTypeMessage = `Kindly reply or send any ${requiredType.map((x) => x.replace(/Message/, '')).join(' or ')}, please.`;
                }

                // Send a message to request the required media type and store information in cookies
                var stanza = await client.sendMessage(message.from, { text: requiredTypeMessage }, { quoted: message });
                return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, media: requiredType });
            }
        }

        // Check if the command requires a query and return an error if no query is provided
        if (cmd.options.query && !query) {
            var stanza = await client.sendMessage(message.from, { text: cmd.options.message?.query || reply.query }, { quoted: message });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, noType: true });
        }

        // Check if the command requires a parameter or quoted message and return an error if no query or quoted message is provided
        if (cmd.options.param && !queries) {
            var stanza = await client.sendMessage(message.from, { text: cmd.options.message?.param || reply.param }, { quoted: message });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, noType: true });
        }

        // Check if the command requires a parameter or quoted message and return an error if no query or quoted message is provided
        if (cmd.options.queries && !queries) {
            var stanza = await client.sendMessage(message.from, { text: cmd.options.message?.queries || reply.param }, { quoted: message });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, noType: true });
        }

        // Check if the command has multiple options and handle option selection
        if (typeof cmd.options.option === 'object' && !cmd.options.option.includes(explode[1])) {
            // Create a message store information in cookies
            var stanza = await client.sendMessage(message.from, { text: `${reply.usage} *${exec} « ${cmd.options.option.join('/')} »*` }, { quoted: message });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, option: cmd.options.option });
        }

        // Check if the command has a regex requirement and return an error if the query doesn't match the regex
        if (cmd.options.regex && !!queries && !cmd.options.regex.test(queries)) {
            let replyMessage;
            aliases.forEach((value) => {
                replyMessage = reply.regex[value] || cmd.options.message?.regex;
            });
            replyMessage = `${replyMessage}\nExample: ${cmd.options.example.replace('@cmd', prefix + cmd.name)}`
            var stanza = await client.sendMessage(message.from, { text: replyMessage }, { quoted: message });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, regex: cmd.options.regex });
        }

        // Check if the command has a mention requirement and return an error if there are no mentions or quoted text
        if (cmd.options.mention && !mentioned[0] && isGroup) {
            var stanza = await client.sendMessage(message.from, { text: reply.mention }, { quoted: message });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, mention: true });
        }

        // Handle cooldown mechanism for the command
        if (timestamps.has(sender)) {
            const amount = (cmd.options.cooldown || 5) * 1000;
            setTimeout(() => timestamps.delete(sender), amount);
            const expiration = timestamps.get(sender) + amount;
            if (now < expiration) {
                const timeleft = (expiration - now) / 1000;
                return client.sendMessage(message.from, { text: reply.cooldown.replace('@time', timeleft.toFixed(1)) }, { quoted: message });
            }
        }

        // If the command has the 'wait' option, send a wait message to the user
        if (cmd.options.wait) {
            await client.sendMessage(message.from, { text: reply.wait }, { quoted: message }).then(() => void 0);
        }

        // Print execution information to the console
        logger.info(`${sender} triggered the command ${command} from ${from} | ${isGroup ? groupSubject : username}`);

        // Execute the command's run method and handle success and failure
        cmd.run(client, message, {
            query, attribute, args, arg, baileys, prefix, command, queries, connect,
            response, dev, selfId: client.decodeJid(client.user.id), conf,
            groupMetadata, groupSubject, groupAdmins, isAdmin, selfAdmin, queue,
            stanza, isGroup, regex: cmd.options.regex, cookies, logger, mentioned, reply, cmd, cookies
        })
            .then(() => {
                logger.info(`Initiated the ${command} command from ${from} | ${isGroup ? groupSubject : username}`);
                const dashcheck = cmd.category != 'private' && db.check('dashboard', cmd.name, 'name');
                if (dashcheck) {
                    dashcheck.success += 1;
                    dashcheck.lastupdate = Date.now();
                    db.replace('dashboard', dashcheck, cmd.name, 'name');
                }
                else {
                    db.modified('dashboard', { name: cmd.name, success: 1, lastupdate: Date.now(), failed: 0 });
                }
            })
            .catch(async (x) => {
                let date = new Date()
                logger.error(`Error occurred during the initiation of the ${command} command from ${from} | ${isGroup ? groupSubject : username}`);
                let content;
                let failedcheck = db.check('dashboard', cmd.name, 'name');
                content = failedcheck || {};
                content.failed = content.failed ? (content.failed + 1) : 1;
                content.lastupdate = Date.now();
                logger.error(x);
                if (failedcheck) {
                    db.replace('dashboard', content, cmd.name, 'name');
                } else {
                    db.modified('dashboard', { name: cmd.name, failed: 1, lastupdate: content.lastupdate, success: 0 });
                }
                return await client.sendMessage(from, { text: `Apologies, but we've encountered an error. Reporting this issue to the developer will aid us in resolving it promptly.\n\nError: ${x.name}\nDescription: ${x.message}` }, { quoted: message });
            })
    }

    /**
     * Event handler for the 'contacts.update' event, triggered when contacts are updated.
     * Updates the contact information and stores it in the database.
     *
     * @param {Array} update - An array of updated contact information.
     *
     * Disabled
    client.ev.on('contacts.update', async (update) => {
        for (let contact of update) {
            let id = client.decodeJid(contact.id);

            // Skip processing if the contact ID is for a status broadcast
            if (id === 'status@broadcast') return;

            // Fetch the profile information for the contact
            const profile = await client.getProfile(id);

            // Update the contact information in the store if available
            if (store && store.contacts) {
                store.contacts[id] = { id, name: contact.notify };
            }

            let values = {};
            let data = db.check('contacts', id) && db.check('contacts', id)[id] || {};

            // Update the name information for the contact
            const name = data.name ? data.name : [];
            name.push(contact.notify);
            const names = name.filter((value, index) => {
                return name.indexOf(value) === index;
            });
            delete data.name;
            values['name'] = names;

            // Update the status information for the contact
            let status = data.status ? data.status : [];
            let check = profile.status ? status.push(profile.status) : false;
            status = check ? objDupl(status) : false;
            delete data.status;
            check ? (values['status'] = status) : false;

            // Update the profile picture information for the contact
            let profilePic = data.profilePic ? data.profilePic : [];
            check = profile.profilePic ? profilePic.push(profile.profilePic) : false;
            profilePic = check ? arrDupl(profilePic) : false;
            delete data.profilePic;
            check ? (values['profilePic'] = profilePic) : false;

            let content = {};
            content[id] = { ...values, ...data };

            // Update the contact information in the database
            db.check('contacts', id) ? db.replace('contacts', content, id) : db.modified('contacts', content);
        }
    })
    */

    /**
     * Event handler for the 'call' event, triggered when there is an incoming call.
     * Handles incoming voice and video call requests.
     *
     * @param {Array} incoming - An array of incoming call objects.
     * @return {Boolean} - Returns `true` if database saved successfully, `undefined` otherwise.
     */
    client.ev.on('call', async (incoming) => {
        for (let call of incoming) {
            // Ignore offline calls
            if (call.offline) return;

            // Determine the call type (voice or video)
            const callType = call.isVideo ? 'video call' : 'voice call';

            // Handle incoming calls for individual contacts
            if (call.isGroup === false) {
                if (call.status === 'offer') {
                    logger.info(`Incoming ${callType} from ${call.from}`);
                    let values = {};
                    let data = db.check('calls', call.from) && db.check('calls', call.from)[call.from] || {};
                    let counts = data.count ? parseInt(data.count) : 0;
                    counts += 1;

                    // Block the caller if they have called multiple times
                    if (counts > 1) {
                        await client.sendMessage(call.from, { text: reply.blockCaller });
                        return client.updateBlockStatus(call.from, 'block')
                            .then((x) => logger.info(`${call.from} has been blocked due to repeated spam calls.`))
                            .catch((x) => x);
                    }

                    values.count = counts;

                    // Update call type information
                    const calls = data.callType ? data.callType : [];
                    calls.push(callType);
                    values.callType = calls;

                    // Update timestamp information
                    const stamp = data.timestamp ? data.timestamp : [];
                    stamp.push(Date.now());
                    values.timestamp = stamp;

                    let content = {};
                    content[call.from] = values;

                    // Send response messages to the caller
                    let config = conf.check('dev', client.decodeJid(client.user.id), 'self');
                    await client.sendMessage(call.from, { text: reply.unavailable.replace('@user', '@' + client.decodeJid(call.from).split('@')[0]).replace('@calltype', callType), withTag: true });
                    let contact = await client.sendContact(call.from, conf.check('dev', 'number'));
                    await client.sendMessage(call.from, { text: reply.devCtc }, { quoted: contact });

                    // Update the call information in the database
                    return db.check('calls', call.from) ? db.replace('calls', content, call.from) : db.modified('calls', content);
                }
            }
        }
    })

    /**
     * Event handler for the 'message.delete' event, triggered when a message is deleted.
     * Handles the anti-delete feature by notifying participants and forwarding the original message.
     *
     * @param {Object} message - The deleted message object.
     * @return {Object} - The forwarded message object.
     */
    client.ev.on('message.delete', async (message) => {
        // Skip if the message or remoteJid is missing
        if (!message || !message.remoteJid) return;

        // Check if anti-delete is enabled for the group
        const antidelete = db.check('antidel', message.remoteJid, 'id');
        if (message.remoteJid.endsWith('@g.us') && !antidelete) return;

        // Skip if anti-delete is not enabled for the remoteJid
        if (!db.check('antidel', message.remoteJid, 'id')) return;

        // Retrieve the original message data from the database using the message ID
        const data = message.id ? db.check('db', message.id, 'id') : void 0;
        if (!data) return;

        // Extract relevant information from the original message
        const msg = data.message;
        const participant = msg.key.remoteJid.endsWith('@g.us')
            ? client.decodeJid(msg.key.participant)
            : client.decodeJid(msg.key.remoteJid);

        // Skip if the message is sent by the bot or if the participant is the bot itself
        if (participant === client.decodeJid(client.user.id)) return;
        if (!participant || !message.fromMe) return;

        // Prepare the notification message with details about the deleted message
        const from = msg.key.remoteJid;
        let text = '';
        text += `❏ Participant: @${participant.split('@')[0]}\n`;
        text += `❏ Deleted message time: ${moment(msg.messageTimestamp * 1000).format('HH:mm:ss')}\n`;
        text += `❏ Type: ${Object.keys(msg.message)[0]}`;

        // Send the notification message and forward the original message
        await client.sendMessage(from, { text: text, withTag: true }, { quoted: msg });
        return await client.sendMessage(from, { forward: msg }, { quoted: msg });
    })

    /**
     * Event handler for the 'messages.upsert' event, triggered when a message is updated or inserted.
     * Handles updating or inserting messages in the database and performing related actions.
     *
     * @param {Array} messages - An array of updated or inserted message objects.
     */
    client.ev.on('messages.upsert', async (response) => {
        // Loop through each updated or inserted message
        // Extracting relevant information from the response
        messages = response.messages[0];

        // Check if the message has key, id, and content
        messages.key && messages.key.id && messages.message ? client.addMessage(messages, Object.keys(messages.message)[0]) : void 0;

        // Function to get the message type
        let messageType = (key) => messages.message && Object.keys(messages.message).find((x) => x === key);

        // Check if the message is a protocol message and is of type 0 (delete message)
        if (messages.message && messages.message.protocolMessage && messages.message.protocolMessage.type == 0 && !messages.key.fromMe) {
            return client.ev.emit('message.delete', messages.message.protocolMessage.key);
        }

        // Check if the message is a group action
        if (messages && messages.messageStubType) {
            return client.ev.emit('group.action', messages);
        }

        // Check if the response type is not 'notify'
        if (response.type !== 'notify') return;

        // Serialize the messages using the client's serialize function
        let message = await client.serialize(client, messages);

        // Check if the serialized message is null or undefined
        if (!message) return;

        // Check if the message is not from a group
        if (!message.isGroup) {
            // Create an empty object to store contact data
            let _a = {};

            // Check if the contact data exists in the database
            const dataContacts = db.check('contacts', message.sender);

            // If contact data exists, update the 'hasChat' property, otherwise create a new entry
            const content = dataContacts ? ((dataContacts[message.sender].hasChat = true) && dataContacts) : ((_a[message.sender] = { 'hasChat': true }) && _a);

            // If contact data exists, replace the existing entry, otherwise add a new entry
            dataContacts ? db.replace('contacts', content, message.sender) : db.modified('contacts', content);
        };

        // Check if the message type is 'messageContextInfo' and delete the corresponding field
        if (messageType('messageContextInfo')) {
            delete message.message.messageContextInfo;
        }

        // Check if the message key corresponds to a status broadcast
        if (message.key && message.key.remoteJid === 'status@broadcast') {
            return;
        }

        // Check if the message type is 'protocolMessage' or 'senderKeyDistributionMessage', and if it's a duplicate in the database
        if (
            messageType('protocolMessage') ||
            (messageType('senderKeyDistributionMessage') && db.duplicate('db', message.key.id, 'id')) ||
            !message.key || message.type === ''
        ) {
            return;
        }

        // Extract the body of the message and handle prefixes
        let { body } = message;
        const prefix = /^[!#%&\?/;:,\.~\-\+=]/;
        let tempPrefix = prefix.test(body) ? body.split('').shift() : '#';
        if (body) {
            body = body.startsWith(tempPrefix) ? body : '';
        } else {
            body = '';
        }

        // Extract arguments from the body
        const arg = body.substring(body.indexOf(' ') + 1);
        const args = body.trim().split(/ +/).slice(1);
        const command = body.trim().split(/ +/)[0];
        const explode = body.trim().split(/ +/);
        let query = body.trim().split(/ +/).slice(1).join(' ');
        const isCommand = body.startsWith(tempPrefix);

        // Group message handling
        if (message.isGroup && !isCommand) {
            // Check for URL in the message body
            if (urlRegex.test(message.body)) {
                const disabledInviteLink = db.check('antilink', message.from, 'id');
                if (disabledInviteLink) {
                    // Extract group metadata
                    var metadata = await client.extractGroupMetadataJid(message.from) || {};
                    var subj = metadata.subject || '';
                    var admins = (jid) => metadata.participant.find((x) => x.jid === jid && (x.type === 'admin' || x.type === 'superadmin'));

                    // Check if the sender is not an admin and the bot is an admin
                    if (!admins(message.sender) && admins(client.decodeJid(client.user.id))) {
                        var regex = /chat.whatsapp.com\/([\w\d]+)/gi;
                        var code = message.body.match(regex);
                        if (code) {
                            code = code[0].replace('chat.whatsapp.com/', '');
                            const validation = await client.checkInviteCode(code);
                            if (validation) {
                                const inviteCode = await client.groupInviteCode(message.from);
                                if (code !== inviteCode) {
                                    // Send warning message and remove the participant for sending an invalid group link
                                    const text = `We've detected a group link invitation. Kindly go through the description and adhere to the group rules. Violation of rules may result in your removal. Thank you.`;
                                    await client.sendMessage(message.from, { text }, { quoted: message });
                                    const reason = ['「 PARTICIPANT REMOVED 」\n'];
                                    let { sender } = message;
                                    reason.push(`User: @${sender.split('@')[0]}`);
                                    reason.push('Reason: *Sending other group link invitation*');
                                    client.groupParticipantsUpdate(message.from, [message.sender], 'remove').then(async (x) => {
                                        if (x[0] && x[0].status === '200') {
                                            await client.sendMessage(message.from, { text: reason.join('\n') }, { quoted: message, withTag: true });
                                        }
                                    }).catch(async (x) => {
                                        await client.sendMessage(message.from, { text: `❏ Error: *${x.name}*\n❏ Error description: *${x.message}*` }, { quoted: message });
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Check for view once message and handle if view once is disabled
            if (message.view_once) {
                const disabledViewOnce = db.check('antiview', message.from, 'id');
                if (disabledViewOnce) {
                    // Extract group metadata
                    var metadata = await client.extractGroupMetadataJid(message.from) || {};
                    var subj = metadata.subject || '';
                    var admins = (jid) => metadata.participant && metadata.participant.find((x) => x.jid === jid && (x.type === 'admin' || x.type === 'superadmin'));
                    if (!admins(message.sender)) {
                        // Modify view once message and relay it back
                        message.message[message.type].contextInfo = { isForwarded: true, forwardingscore: 1, mentionedJid: message.mentions };
                        const contentMSG = await baileys.generateWAMessageFromContent(message.from, message.message, { quoted: message, userJid: client.user.id });
                        await client.relayMessage(message.from, contentMSG.message, {
                            messageId: contentMSG.key.id, userJid: client.user.id
                        });
                    }
                }
            }

            // Auto-join group if enabled and a valid invitation link is detected
            if (settings.get('autojoin') && /chat.whatsapp.com\/([\w\d]*)/gi.test(message.body)) {
                const groupCode = message.body.match(/chat.whatsapp.com\/([\w\d]*)/gi)[0].replace('chat.whatsapp.com/', '');
                let isValidInvitationLink = await client.checkInviteCode(code);
                if (isValidInvitationLink) {
                    await client.groupAcceptInvite(groupCode)
                        .then((x) => logger.info(`Triggering auto-join for group ${x} from ${message.from} with the subject: ${subject}.`))
                        .catch(() => void 0);
                }
            }
        }

        // Check if there's a quoted message and corresponding cookie data
        if (message.quoted && cookies.get(message.from) && (stanza = cookies.get(message.from).get(message.quoted.id), stanza)) {
            let { body } = message;

            // Check if media type matches and execute corresponding command
            if (typeof stanza.media === 'object' && stanza.media.includes(client.messageTypes(message))) {
                return await client.execute(client, message, {
                    exec: stanza.cmd.name, arg: body.split(/ +/)[0], args: body.split(/ +/),
                    command: stanza.cmd.name, query: body, prefix: stanza.prefix,
                });
            }

            // Check for noType condition and execute command
            if (stanza.noType) {
                setTimeout(() => cookies.get(message.from).delete(message.quoted.id), 1000 * 30);
                return await client.execute(client, message, {
                    exec: stanza.cmd.name, arg: body.split(/ +/)[0], args: body.split(/ +/),
                    command: stanza.cmd.name, query: body, prefix: stanza.prefix,
                });
            }

            // Check for regex condition and execute command
            if (stanza.regex) {
                setTimeout(() => cookies.get(message.from).delete(message.quoted.id), 1000 * 30);
                return await client.execute(client, message, {
                    exec: stanza.cmd.name, arg: body.split(/ +/)[0], args: body.split(/ +/),
                    command: stanza.cmd.name, query: body, prefix: stanza.prefix,
                });
            }

            // Check for mention condition and execute command
            if (stanza.mention) {
                return await client.execute(client, message, {
                    exec: stanza.cmd.name, arg: body.split(/ +/)[0], args: body.split(/ +/),
                    command: stanza.cmd.name, query: body, prefix: stanza.prefix,
                });
            }
        }

        // Check if the sender is developer
        var isDev = conf.check('config', message.sender, 'jid');

        // Check if the sender or the group is banned
        if (db.check('banned', message.from, 'id') && !isDev) return;
        if (db.check('banned', message.sender, 'id') && !isDev) return;

        // Extract the command name from the message body
        const cmdname = body.slice(tempPrefix.length).trim().split(/ +/).shift().toLowerCase();

        // Find the command based on the command name or its aliases
        const cmd = attribute.command.get(body.trim().split(/ +/).shift().toLowerCase()) ||
            [...attribute.command.values()].find((x) => x.alias.find((x) => x.toLowerCase() === body.trim().split(/ +/).shift().toLowerCase())) ||
            attribute.command.get(cmdname) ||
            [...attribute.command.values()].find((x) => x.alias.find((x) => x.toLowerCase() === cmdname));

        // If no matching command is found, return
        if (!cmd) return;

        // Execute the command
        return await client.execute(client, message, {
            exec: cmd.name, command, arg, args, query, prefix: tempPrefix, response,
            explode
        });
    })
}
connect();