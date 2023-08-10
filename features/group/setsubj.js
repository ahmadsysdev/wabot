module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'setsubj',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['setsubject', 'setsub'],

    /**
     * Command description.
     * @type {string}
     */
    desc: `To modify the group's subject.`,

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
     * Indicates if the user running the command must also be a group admin.
     * @type {boolean}
     */
    selfAdmin: true,

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
        
        if (!query) {
            return await client.sendMessage(message.from, { text: `Usage: *${command} < text/reply >` }, { quoted: message });
        }
        
        await client.groupUpdateSubject(message.from, query);
    }
}