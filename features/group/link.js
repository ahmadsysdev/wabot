module.exports = {
    // The name of the command.
    name: 'linkgc',
    // Aliases for the command.
    alias: ['linkgroup', 'linkgp', 'link'],
    // Description of the command.
    desc: 'Extract group invite link (requiring admin privileges).',
    // Category of the command.
    category: 'group',
    // Indicates if this command requires to be used in a group.
    isGroup: true,
    // Indicates if the user running the command must be an admin.
    isAdmin: true,
    // Indicates if the bot itself must be an admin.
    selfAdmin: true,
    /**
    * The main function to run the command.
    * @param {Object} client - The WhatsApp client instance.
    * @param {Object} message - The message that triggered the command.
    */
    async run(client, message) {
        return client.groupInviteCode(message.from, { reply })
            .then(async (x) => await client.sendMessage(message.from, { text: `https://chat.whatsapp.com/${x}` }, { quoted: message }))
            .catch(async () => await client.sendMessage(message.from, { text: reply.error }, { quoted: message }));
    },
};
