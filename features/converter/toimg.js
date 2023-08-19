// Import the webp2png function from the specified path
const { webp2png } = require('../../lib/webp2');

// Export the module
module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'toimg',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['toimage'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Convert a sticker message into an image.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'converter',

    /**
     * Specifies the media type required for this command.
     */
    media: { stickerMessage: true },

    /**
     * Indicates if this command requires waiting for async operations.
     * @type {boolean}
     */
    wait: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.reply - Reply object.
     */
    async run(client, message, { reply }) {
        // Extract 'quoted' and 'from' properties from the message
        const { quoted, from } = message;

        // Download the sticker media
        let media = await quoted.download();

        // Convert the sticker to an image using the webp2png function
        const output = await webp2png(media);

        // Send the converted image
        return await client.sendImage(from, output, reply.done, message);
    }
};