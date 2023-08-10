module.exports = {
    /**
     * Name of the command.
     */
    name: 'antidelete',
    /**
     * Aliases for the command.
     */
    alias: ['antidel', 'adl'],
    /**
     * Description of the command.
     */
    desc: 'When a message is deleted by an individual, the deleted message is automatically sent to the current group.',
    /**
     * Usage information for the command.
     */
    use: '< on/off >',
    /**
     * Category of the command.
     */
    category: 'group',
    /**
     * Options for the command.
     */
    option: ['on', 'off'],
    /**
     * Indicates if this command only works within groups.
     */
    isGroup: true,
    /**
     * Indicates if the command requires admin privileges.
     */
    isAdmin: true,

    /**
     * The main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} args - The command arguments.
     * @param {string} args.arg - The argument provided with the command.
     * @param {string} args.prefix - The command prefix used in the message.
     * @param {string} args.command - The name of the command used.
     * @param {string} args.stanza - The stanza of the message.
     */
    async run(client, message, { arg, prefix, command, stanza }) {
        // Check if antidelete is enabled for the user
        const data = db.check('antidel', message.from, 'id');
        const content = { id: message.from };
        // Toggle antidelete based on the provided argument
        var turn = data ? (arg === 'on' ? void 0 : db.delete('antidel', message.from, 'id')) : (arg === 'on' ? db.modified('antidel', content, 'id') : void 0);

        // Return appropriate response based on the action
        if (!turn) {
            return await client.sendMessage(message.from, { text: `Antidelete has been turned ${arg} before.` }, { quoted: message });
        } else {
            return await client.sendMessage(message.from, { text: `Antidelete message turned ${arg} successfully` }, { quoted: message });
        }
    }
}