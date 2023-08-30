module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'mute',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['mutes', 'mt'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'To prevent participants from sending messages, change the group settings to announcement-only mode.',

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
    async run(client, message, { reply }) {
        await client.groupSettingUpdate(message.from, 'announcement')
            .catch(async () => await client.sendMessage(message.from, { text: reply.error }, { quoted: message }));
    },
};
