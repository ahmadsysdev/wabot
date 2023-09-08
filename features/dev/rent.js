module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'rent',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['bot'],

    /**
     * Command category.
     * @type {string}
     */
    category: 'developer',

    /**
     * Indicates if this command requires a query.
     * @type {boolean}
     */
    query: true,

    /**
     * Indicates if this command is only available for developers.
     * @type {boolean}
     */
    isDev: true,

    /**
     * Regular expression to validate the time amount format.
     * @type {RegExp}
     */
    regex: /\d+[wsdhym]$/,

    /**
     * Message to display when the time amount format is invalid.
     * @type {string}
     */
    message: { regex: `Invalid time amount format.` },

    /**
     * Represents an example message for assistance.
     * @type {string}
     */
    example: '@cmd 30d @user',

    /**
     * Command usage.
     * @type {string}
     */
    usage: '< reply/mention > < periods >',

    /**
     * Indicates if the command requires a mention.
     * @type {boolean}
     */
    mention: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.queries - Extracted queries from the message.
     * @param {Object} options.mentioned - Mentioned participant.
     * @param {boolean} options.isGroup - Indicates if the command was triggered in a group.
     */
    async run(client, message, { queries, mentioned, isGroup, connect }) {
        // If not in a group, add the sender as a mentioned user
        if (!isGroup) mentioned.push(message.from);

        // Split and extract the query
        const explode = queries.split(/ +/);
        const query = explode[explode.length - 1];

        // Object to store the results of rents
        const results = { success: [], failed: [] };

        // Import the addClient function
        const { addClient } = require('../../lib/senderType');
        
        // Process each mentioned participant
        mentioned.forEach(participant => {
            // AddClient to the participant
            if (addClient(participant, query)) {
                results.success.push(participant);
                connect(`./session/${participant.split('@')[0]}`, participant)
            } else {
                results.failed.push(participant);
            }
        });

        // Send appropriate response based on results
        if (results.failed[0]) {
            await client.sendMessage(message.from, { text: `Rent of ${results.failed.map(value => '@' + value.replace('@s.whatsapp.net', '')).join(', ')} failed.`, withTag: true }, { quoted: message });
        }
        if (results.success[0]) {
            await client.sendMessage(message.from, { text: reply.done }, { quoted: message });
        }
    }
};