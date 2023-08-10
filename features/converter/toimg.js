const { webp2png } = require('../../lib/webp2');

module.exports = {
    name: 'toimg',
    alias: ['toimage'],
    desc: 'Convert a sticker message into an image.',
    category: 'converter',
    media: { stickerMessage: true },
    wait: true,
    /**
     * Convert a sticker message into an image.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @returns {Object} - An object containing information about the sent message.
     */
    async run(client, message) {
        const { quoted, from } = message;

        // Download the sticker media
        let media = await quoted.download();

        // Convert the sticker to an image using webp2png function
        const output = await webp2png(media);

        // Send the converted image
        return await client.sendImage(from, output, 'Done.', message);
    }
}