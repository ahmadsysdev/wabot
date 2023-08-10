module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'setwelcome',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['setjoin', 'setwelc'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'To configure the welcome handler message. When a new member joins the group, an automatic welcome message will be sent.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

    /**
     * Command usage syntax.
     * @type {string}
     */
    use: '< text/reply >',

    /**
     * Indicates if this command requires to be used in a group.
     * @type {boolean}
     */
    isGroup: true,

    /**
     * Indicates if the user running the command must be an admin.
     * @type {boolean}
     */
    isAdmin: true,

    /**
     * Indicates if the command requires parameters.
     * @type {boolean}
     */
    param: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} param - The command parameters.
     */
    async run(client, message, { query, command }) {
        query = query !== '' ? query : (message.quoted && message.quoted.text || '');

        if (query === '') {
            // Provide an example and explanation for the command usage
            const text = [
                `Usage: ${command} < text/reply >`,
                'Variable:',
                '@user: Participant who joins',
                '@desc: Group description',
                '@subj: Group subject',
                `Example: *${command} Welcome to @subj @user! Make sure you read our description.*\n*Description: @desc*`
            ];
            return await client.sendMessage(message.from, { text: text.join('\n') }, { quoted: message });
        }

        // Save or update the welcome message in the database
        const data = db.check('welcome', message.from, 'id');
        const content = { id: message.from, message: query };
        const set = data ? db.replace('welcome', content, message.from, 'id') : db.modified('welcome', content);

        if (!set) {
            return await client.sendMessage(message.from, { text: 'An error occurred. Failed to detect error details, but this might be a problem with the database.' }, { quoted: message });
        }

        return await client.sendMessage(message.from, { text: 'Welcome handler message successfully set.' }, { quoted: message });
    }
}