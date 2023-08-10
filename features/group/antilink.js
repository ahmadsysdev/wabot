module.exports = {
    /**
     * Name of the command.
     */
    name: 'antilink',
    /**
     * Description of the command.
     */
    desc: 'In case a participant shares a WhatsApp group invitation link in the group, an automatic removal will be executed immediately.',
    /**
     * Usage information for the command.
     */
    use: '< on/off >',
    /**
     * Category of the command.
     */
    category: 'group',
    /**
     * Indicates if this command only works within groups.
     */
    isGroup: true,
    /**
     * Indicates if the command requires admin privileges.
     */
    isAdmin: true,
    /**
     * Indicates if the user should have self admin privileges.
     */
    selfAdmin: true,
    /**
     * Options for the command.
     */
    option: ['on', 'off'],

    /**
     * The main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} args - The command arguments.
     * @param {string} args.arg - The argument provided with the command.
     * @param {string} args.prefix - The command prefix used in the message.
     * @param {string} args.command - The name of the command used.
     */
    async run(client, message, { arg, prefix, command }) {
        // Check if antilink is enabled for the group
        const data = db.check('antilink', message.from, 'id');
        const content = { id: message.from };
        // Toggle antilink based on the provided argument
        var turn = data ? (arg === 'on' ? void 0 : db.delete('antilink', message.from, 'id')) : (arg === 'on' ? db.modified('antilink', content) : void 0);

        // Return appropriate response based on the action
        if (!turn) {
            return await client.sendMessage(message.from, { text: `Antilink has been turned ${arg} before.` }, { quoted: message });
        } else {
            return await client.sendMessage(message.from, { text: `Antilink message group turned ${arg} successfully.` }, { quoted: message });
        }
    },
};
