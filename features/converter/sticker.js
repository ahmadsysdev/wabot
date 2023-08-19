const { sticker } = require('../../lib/convert');
const { exifStick, createExif } = require('../../lib/exif');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'sticker',
    alias: [
        's', 'stick', 'stiker', 'stik', 'swm', 'stickerwm',
        'stickerwm', 'stickergif', 'gifsticker', 'stikergif',
        'gifstiker',
    ],
    desc: 'Convert a video or image into a sticker message. You can easily change the sticker author and sticker name by following the example.',
    category: 'converter',
    usage: '< reply/caption > [author/packname]',
    media: { imageMessage: true, videoMessage: true, stickerMessage: true, documentMessage: true },
    wait: true,
    /**
     * @param {object} client - The client instance that handles the bot's interactions with WhatsApp.
     * @param {object} message - The message object containing information about the received message.
     * @param {object} options - Additional options passed to the command.
     * @param {string} options.query - The query provided to the command (if any).
     */
    async run(client, message, { query }) {
        // Extract necessary properties from the message object
        const { quoted, from, type } = message;

        // Convert the quoted message content to JSON string
        const content = JSON.stringify(quoted);

        // Determine the type of the received message
        const isMedia = type === 'imageMessage' || type === 'videoMessage';
        const isQImg = type === 'extendedTextMessage' && content.includes('imageMessage');
        const isQVideo = type === 'extendedTextMessage' && content.includes('videoMessage');
        const isQDoc = type === 'extendedTextMessage' && content.includes('documentMessage');
        const isQStick = type === 'extendedTextMessage' && content.includes('stickerMessage');

        // Split the query parameter using the '|' delimiter
        query = query.split('|');

        // Get pack information from the config or use default values
        const config = conf.check('config', 'packInfo');
        const packInfo = {
            packname: query[0] || config.packInfo.packname,
            author: query[1] || config.packInfo.author,
        };

        let buffer, stickerBuff;
        try {
            // Check if the message is a quoted sticker
            if (isQStick) {

                // Download the quoted message and save it as a webp file
                buffer = await quoted.download();
                const filename = path.join('.', 'temp', Date.now() + '.webp');
                fs.writeFileSync(filename, buffer);

                // Create exif data and apply it to the sticker
                await createExif(query[0] || packInfo.packname, query[1] || config.packInfo.author);
                return await exifStick(filename, client, message);
            }
            // Check if the message is an image or a quoted image
            else if ((isMedia && !message.message.videoMessage) || isQImg) {
                buffer = isQImg ? await quoted.download() : await message.download();
                stickerBuff = await sticker(buffer, { isImage: true, withPackInfo: true, packInfo, cmdType: '1' });
                return await client.sendMessage(from, { sticker: stickerBuff }, { quoted: message });
            }
            // Check if the message is a small video or a quoted small video
            else if ((isMedia && message.message.videoMessage.fileLength < 2 << 20) ||
                (isQVideo && quoted.message.videoMessage.fileLength < 2 << 20)) {
                buffer = isQVideo ? await quoted.download() : await message.download();
                stickerBuff = await sticker(buffer, { isVideo: true, withPackInfo: true, packInfo, cmdType: '1' });
                return await client.sendMessage(from, { sticker: stickerBuff }, { quoted: message });
            }
            // Check if the quoted message is an image or a small video document
            else if (isQDoc &&
                (/image/.test(quoted.message.documentMessage.mimetype) ||
                    (/video/.test(quoted.message.documentMessage.mimetype) &&
                        quoted.message.documentMessage.fileLength < 2 << 20))) {
                let ext = /image/.test(quoted.message.documentMessage.mimetype)
                    ? { isImage: true }
                    : /video/.test(quoted.message.documentMessage.mimetype)
                        ? { isVideo: true }
                        : void 0;
                if (!ext) return await client.sendMessage(from, { text: 'Unknown file mimetype.' }, { quoted: message });
                buffer = await quoted.download();
                stickerBuff = await sticker(buffer, { ...ext, withPackInfo: true, packInfo, cmdType: '1' });
                return await client.sendMessage(from, { sticker: stickerBuff }, { quoted: message });
            }
            // Handle the case where the message type is not supported
            else {
                return await client.sendMessage(from, { text: `Please ensure you're quoting sticker, video, or image messages.` }, { quoted: message });
            }
        } catch (err) {
            throw (err);
        }

    }
}