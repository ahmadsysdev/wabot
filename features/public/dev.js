module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'developer',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['dev', 'owner', 'contact'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Send developer contact.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'public',

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     */
    async run(client, message) {
        // Fetch developer's contact information from the configuration
        const obj = conf.check('dev', 'number');

        // Send the developer's contact to the user
        let contact = await client.sendContact(message.from, obj, message);
        
        // Construct a text message with the developer's contact details
        let text = [];
        for (let i of Object.keys(obj)) {
            if (i === 'jid') {
                obj['tag'] = '@' + obj[i].replace('@s.whatsapp.net', '');
                i = 'tag';
            }
            if (i === 'self') continue;
            let key = i.charAt(0).toUpperCase() + i.slice(1);
            text.push(`❏ ${key}: *${obj[i]}*`);
        }

        // Add an important message regarding contacting the developer
        text.push('\nImportant message: AVOID BOTHERING THE DEVELOPER WITH SPAMMING VIDEO/VOICE CALLS OR SIMILAR ACTIONS, OR YOU MAY BE BLOCKED AND BANNED PERMANENTLY.');
        
        // Send the constructed text message to the user
        return await client.sendMessage(message.from, { text: text.join('\n'), withTag: true }, { quoted: message });
    }
}