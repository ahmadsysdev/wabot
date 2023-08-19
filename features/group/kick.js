module.exports = {
    /**
     * Name of the command.
     */
    name: 'kick',
    /**
     * Aliases for the command.
     */
    alias: ['remove', 'remv'],
    /**
     * Description of the command.
     */
    desc: 'To remove other participants.',
    /**
     * Category of the command.
     */
    category: 'group',
    /**
     * Usage syntax for the command.
     */
    usage: '< mention/reply >',
    /**
     * Indicates if this command requires to mention participants.
     */
    mention: true,
    /**
     * Indicates if this command requires to be used in a group.
     */
    isGroup: true,
    /**
     * Indicates if the user running the command must be an admin.
     */
    isAdmin: true,
    /**
     * Indicates if the bot itself must be an admin.
     */
    selfAdmin: true,
    /**
     * The main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options - The options passed to the command.
     * @param {string} options.query - The query extracted from the message.
     * @param {string} options.command - The command name.
     * @param {import('whatsapp-web.js').GroupMetadata} options.groupMetadata - The metadata of the group.
     * @param {string} options.selfId - The ID of the bot itself.
     */
    async run(client, message, { query, command, groupMetadata, selfId, reply }) {
        // Extract participants to be removed based on mentions, reply, or query
        let participant = ((message.mentions && message.mentions[0]) ? message.mentions : (message.quoted ? [message.quoted.sender] : [query.replace(/[^0-9]/g, "") + "@s.whatsapp.net"])).filter((x) => {
            if (x === '@.whatsapp.com') return;
            if (x === selfId) return client.sendMessage(message.from, { text: reply.removeSelfError }, { quoted: message }).then(() => void 0) && undefined;
            return true;
        });
        if (participant.length === 0) return; // No participants to remove
        return client.groupParticipantsUpdate(message.from, participant, 'remove')
            .catch(() => client.sendMessage(message.from, { text: reply.error }, { quoted: message }).then(() => void 0));
    }
}