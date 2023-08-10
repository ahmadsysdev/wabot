module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'unmute',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['unrestrict', 'unlock'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'To enable messages from other participants, remove the restrictions on group messaging.',

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
     * Indicates if the user running the command must also be a self admin.
     * @type {boolean}
     */
    selfAdmin: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     */
    async run(client, message) {
        // Update the group setting to allow participants to send messages
        await client.groupSettingUpdate(message.from, 'not_announcement');
    },
};
