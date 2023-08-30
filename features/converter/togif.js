// Import the webp2mp4 function from the specified path
const { webp2mp4 } = require('../../lib/webp2');

// Export the module
module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'togif',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['tovid'],

    /**
     * Command category.
     * @type {string}
     */
    category: 'converter',

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Convert an animated sticker into a gif message.',

    /**
     * Indicates if this command requires waiting for async operations.
     * @type {boolean}
     */
    wait: true,

    /**
     * Specifies the media type required for this command.
     */
    media: { stickerMessage: true },

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.reply - Reply object.
     */
    async run(client, message, { reply, logger }) {
        // Extract 'from' and 'quoted' properties from the message
        const { from, quoted } = message;

        // Download the animated sticker media
        const media = await quoted.download();

        // Convert the animated sticker to a gif using the webp2mp4 function
        let output = await webp2mp4(media);

        // Send the converted gif as a video message
        return await client.sendVideo(from, output, reply.done, message).catch(err => logger.error(err));
    }
};
