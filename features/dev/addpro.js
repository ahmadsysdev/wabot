module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'addpro',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['addprofessional', 'topro'],

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
    message: 'Invalid time amount format.\nExample query: 30d',

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
    async run(client, message, { queries, mentioned, isGroup }) {
        // If not in a group, add the sender as a mentioned user
        if (!isGroup) mentioned.push(message.from);

        // Split and extract the query
        const explode = queries.split(/ +/);
        const query = explode[explode.length - 1];

        // Object to store the results of adding professional
        const results = { success: [], failed: [], already: [] };

        // Import the addProfessional function
        const { addProfessional } = require('../../lib/senderType');
        
        // Process each mentioned participant
        mentioned.forEach(participant => {
            // Check if participant is already a professional user
            data = db.check('professional', participant, 'id') ? 'professional' : (db.check('premium', participant, 'id') && 'premium');
            if (data) {
                results.already.push(participant);
                return;
            }

            // Add professional for the participant
            if (addProfessional(participant, query)) {
                results.success.push(participant);
            } else {
                results.failed.push(participant);
            }
        });

        // Send appropriate response based on results
        if (results.failed[0]) {
            await client.sendMessage(message.from, { text: `Upgrade of ${results.failed.map(value => '@' + value.replace('@s.whatsapp.net', '')).join(', ')} to professional failed.`, withTag: true }, { quoted: message });
        } else if (results.already[0]) {
            await client.sendMessage(message.from, { text: `No need, ${results.already.map(value => '@' + value.replace('@s.whatsapp.net', '')).join(', ')} ${results.already.length === 1 ? 'is already a' : 'are already'} ${data} user(s).`, withTag: true }, { quoted: message });
        }
        if (results.success[0]) {
            await client.sendMessage(message.from, { text: `Done.` }, { quoted: message });
        }
    }
};