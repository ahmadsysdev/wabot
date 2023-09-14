const { image } = require("googlethis")

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'image',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['imagesearch', 'img'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Text-to-image.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'public',

    /**
     * Indicates if this command requires a query.
     * @type {boolean}
     */
    query: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.reply - The reply message object
     */
    async run(client, message, { reply, queries }) {
        const results = await image(queries, { safe: true });
        if (!results[0]) {
            return await client.sendMessage(message.from, { text: 'Not found.' }, { quoted: message });
        }
        const index = Math.floor(Math.random() * results.length);
        return await client.sendImage(message.from, results[index].url, reply.done, message);
    }
}