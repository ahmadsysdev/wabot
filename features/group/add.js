module.exports = {
    /**
     * Name of the command.
     */
    name: 'add',
    /**
     * Description of the command.
     */
    desc: 'Add a new participant to the group, if possible.',
    /**
     * Usage information for the command.
     */
    usage: '< mention/reply/number >',
    /**
     * Category of the command.
     */
    category: 'group',
    /**
     * Indicates if this command only works within groups.
     */
    isGroup: true,
    /**
     * Indicates if the command requires self-admin privileges.
     */
    selfAdmin: true,
    /**
     * Indicates if the command requires admin privileges.
     */
    isAdmin: true,
    /**
     * Cooldown time for the command in seconds.
     */
    // cooldown: 10,
    /**
     * Indicates if the command expects parameters.
     */
    param: true,
    /**
     * Represents an example message for assistance.
     * @type {string}
     */
    example: '@cmd 60123456789',

    /**
     * The main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} args - The command arguments.
     * @param {string} args.query - The query or input provided with the command.
     * @param {string} args.prefix - The command prefix used in the message.
     */
    async run(client, message, { query, reply }) {
        // Process the query or quoted message
        query = (message.quoted ? message.quoted.sender.split('@')[0] : query.replace(/[\s-]/g, ''));

        // Extract participant numbers from the query
        let participant = query.match(/\d{5,16}/g);
        let participants = [];
        for (let value of participant) {
            if (/^\d+$/.test(value)) participants.push(value + '@s.whatsapp.net');
        }

        // Add participants to the group
        return client.groupParticipantsAdd(message.from, participants)
            .then((x) => {
                for (let i of x) {
                    if (i.status === '403') {
                        // Handle privacy settings change
                        client.sendMessage(message.from, {
                            text: reply.privateInvite.replace('@user', '@' + i.jid.split('@')[0]),
                            withTag: true,
                        }, { quoted: message }).then((x) => void 0);
                        client.sendGroupInvite(message.from, i.jid, i.invite.code, i.invite.expiration)
                            .then((x) => void 0);
                    }
                    if (i.status == '409') {
                        // Handle already existing participants
                        client.sendMessage(message.from, { text: reply.alreadyJoin.replace('@user', '@' + i.jid.split('@')[0]), withTag: true }, { quoted: message }).then(() => void 0);
                    }
                }
            })
            .catch((err) => {
                // Handle errors
                client.sendMessage(message.from, { text: reply.error }, { quoted: message }).then((x) => void 0);
            });
    },
};
