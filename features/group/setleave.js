module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'setleave',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['setleft', 'stleft'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'To configure the leave message handler. When a member leaves the group, an automatic leave message will be sent.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

    /**
     * Command usage syntax.
     * @type {string}
     */
    usage: '< text/reply >',

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
    example: '@cmd on',

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} param - The command parameters.
     */
    async run(client, message, { query, command, db, reply }) {
        query = query !== '' ? query : (message.quoted && message.quoted.text || '');

        if (query === '') {
            let text = [`Usage: *${command} < text/reply >*`];
            text.push('Variable:');
            text.push('@user: Participant who leaves');
            text.push('@subj: Group subject');
            text.push(`Example: *${command} Bye @user! Thank you for joining our group @subj.*`);
            return await client.sendMessage(message.from, { text: text.join('\n') }, { quoted: message });
        }

        const data = db.check('left', message.from, 'id');
        const content = { id: message.from, message: query };
        const set = data ? db.replace('left', content, message.from, 'id') : db.modified('left', content);

        if (!set) {
            return await client.sendMessage(message.from, { text: reply.error }, { quoted: message });
        }

        const name = 'Leave message';
        return await client.sendMessage(message.from, { text: reply.successfullySet.replace('@cmdname', name) }, { quoted: message });
    }
}