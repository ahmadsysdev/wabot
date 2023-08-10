const { webp2mp4 } = require('../../lib/webp2');


module.exports = {
    name: 'togif',
    alias: ['tovid'],
    category: 'converter',
    desc: 'Convert a animated sticker into a gif message.',
    wait: true,
    media: { stickerMessage: true },
    /**
     * Convert an animated sticker into a gif message.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} args - The command arguments.
     * @return {Object} - An object containing information about the sent message.
     */
    async run(client, message) {
        const { from, quoted } = message;

        // Download the animated sticker media
        const media = await quoted.download();

        // Convert the animated sticker to a gif using webp2mp4 function
        let output = await webp2mp4(media);

        // Send the converted gif as a video message
        return await client.sendVideo(from, output, 'Done.', message).catch((err) => console.log(err));
    }
}