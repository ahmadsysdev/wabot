module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'revoke',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['resetgp', 'resetlink', 'revokeinvite'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Revoke group link invitation.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

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
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     */
    async run(client, message) {
        client.groupRevokeInvite(message.from)
            .catch(async () => await client.sendMessage(message.from, { text: 'An error occurred.' }, { quoted: message }));
    }
}