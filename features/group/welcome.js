module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'welcome',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['welc', 'welchandler'],

    /**
     * Command description.
     * @type {string}
     */
    desc: `To activate the join handler message, an automatic welcome message will be sent when someone joins the group.`,

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

    /**
     * Command usage and options.
     * @type {string}
     */
    use: '< on/off >',
    option: ['on', 'off'],

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
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options - Command options such as 'arg', 'prefix', 'command', etc.
     */
    async run(client, message, { arg, prefix, command }) {
        // Check if the welcome handler is already enabled
        const data = db.check('welcome', message.from, 'id');
        const content = { id: message.from };

        // Determine whether to enable or disable the welcome handler based on the argument
        var turn = data ? (arg === 'on' ? void 0 : db.delete('welcome', message.from, 'id')) : (arg === 'on' ? db.modified('welcome', content) : void 0);

        // Inform the user about the status of the welcome handler
        if (!turn) {
            return await client.sendMessage(message.from, { text: `Welcome handler message has been ${arg} before.` }, { quoted: message });
        }

        // Construct a response message regarding the status of the welcome handler
        let text = [`Welcome message handler turned ${arg} successfully. `];

        // Provide instructions on how to set the welcome handler message
        if (arg === 'on') {
            text[0] += `You can set the handler message by using this command:`;
            text.push(`*${prefix}setwelcome <text/reply>*\n`);
            text.push('Variable:');
            text.push('@user: Participant who joined');
            text.push('@desc: Group description');
            text.push('@subj: Group subject');
            text.push(`Example: *${prefix}setwelcome Welcome to @subj @user! Make sure you read our description.*\n*Description: @desc*`);
        }

        // Send the response message and handle any further steps if needed
        var stanza = await client.sendMessage(message.from, { text: text.join('\n') }, { quoted: message });
        if (arg === 'on') {
            const cmd = attribute.command.get('setwelcome');
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, noType: true });
        }
    }
}