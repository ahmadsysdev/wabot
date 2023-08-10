module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'setdesc',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['setdescription', 'setdes', 'setd'],

    /**
     * Command description.
     * @type {string}
     */
    desc: `To modify the group's description.`,

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

    /**
     * Command usage information.
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
     * Indicates if the bot itself must be an admin.
     * @type {boolean}
     */
    selfAdmin: true,

    /**
     * Indicates if this command requires a parameter.
     * @type {boolean}
     */
    param: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} param - The command parameters.
     */
    async run(client, message, { query }) {
        if (query && typeof query !== 'undefined') {
            return await client.groupUpdateDescription(message.from, query)
                .catch(async () => await client.sendMessage(message.from, { text: 'An error occurred.' }, { quoted: message }));
        }
        if (message.quoted) {
            return await client.groupUpdateDescription(message.from, message.quoted.text)
                .catch(async () => await client.sendMessage(message.from, { text: 'An error occurred.' }, { quoted: message }));
        }
    }
}