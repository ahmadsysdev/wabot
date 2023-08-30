module.exports = {
    /**
     * Name of the command.
     */
    name: 'leavehandler',
    /**
     * Aliases for the command.
     */
    alias: ['lefthandler', 'left', 'lfthndler'],
    /**
     * Description of the command.
     */
    desc: 'When the leave handler message is enabled, a predefined leave message will be sent automatically when a member leaves the group.',
    /**
     * Category of the command.
     */
    category: 'group',
    /**
     * Usage syntax for the command.
     */
    usage: '< on/off >',
    /**
     * Indicates if this command requires to be used in a group.
     */
    isGroup: true,
    /**
     * Indicates if the user running the command must be an admin.
     */
    isAdmin: true,
    /**
     * Mapping of command options to their display labels.
     */
    option: ['on', 'off'],
    example: '@cmd on',
    /**
     * The main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options - The options passed to the command.
     * @param {string} options.arg - The argument passed to the command ('on' or 'off').
     * @param {string} options.prefix - The command prefix.
     * @param {Object} options.command - The command object.
     * @param {Object} options.attribute - Additional attributes associated with the command.
     * @param {Object} options.cookies - Cookies associated with the command.
     */
    async run(client, message, { arg, prefix, command, attribute, cookies, reply }) {
        const data = db.check('left', message.from, 'id');
        const content = { id: message.from };
        var turn = data ? (arg === 'on' ? void 0 : db.delete('left', message.from, 'id')) : (arg === 'on' ? db.modified('left', content) : void 0);
        if (!turn) return await client.sendMessage(message.from, { text: reply.alreadySwitched.replace('@cmdname', this.name.strCharAt(0).toUpperCase() + this.name.slice(1)).replace('@switch', arg) }, { quoted: message });

        let text = [];
        text.push(reply.switched.replace('@cmdname', this.name.strCharAt(0).toUpperCase() + this.name.slice(1)).replace('@switch', arg));
        if (arg === 'on') {
            text[0] += 'You can set the handler message by using this command:';
            text.push(`*${prefix}setleave <text/reply>*\n`);
            text.push('Variables:');
            text.push('@user: Participant who left');
            text.push('@subj: Group subject');
            text.push(`Example: *${prefix}setleave Bye @user! Thank you for joining our group @subj.*`);
        }
        var stanza = await client.sendMessage(message.from, { text: text.join('\n') }, { quoted: message });
        if (arg === 'on') {
            const cmd = attribute.command.get('setleave');
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, noType: true });
        }
    }
}