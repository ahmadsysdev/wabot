module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'bcgc',

    /** 
     * Command aliases.
     * @type {string[]}
     */
    alias: ['broadcastgroup', 'bcgroup'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Broadcast message to all group.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'professional',

    /**
     * Indicates if this command is only available for professional users.
     * @type {boolean} 
     */
    isProfessional: true,

    /**
     * Wait message.
     * @type {boolean}
     */
    wait: true,

    /**
     * Command usage.
     * @type {string}
     */
    usage: '< reply >',

    /**
     * Indicates if this command requires a quoted message.
     * @type {boolean}
     */
    isQuoted: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.query - The command query.
     * @param {Object} options.reply - Reply messages.
     * @param {Object} options.baileys - Baileys library.
     * @param {Object} options.logger - Logger instance.
     */
    async run(client, message, { query, reply, baileys, logger }) {
        // Get all groups.
        const getGroups = await client.groupFetchAllParticipating();
        const groups = Object.entries(getGroups).slice(0).map((entry => entry[1]));

        // Sent total.
        let sent = 0;

        // Get message quoted object.
        const data = await message.getQuotedObj();
        if (!data) return await client.sendMessage(message.from, { text: reply.notFound }, { quoted: message });

        // Iterate through groups and send the message.
        const iteration = setInterval(async () => {
            if (groups.length <= sent) {
                // Inform the sender that the message have been sent.
                await client.sendMessage(message.from, { text: reply.sentPS.replace('@sent', sent) }, { quoted: message });
                return clearInterval(iteration);
            }
            // console.log('counting:', groups.length, sent)

            if (!groups[sent].id) return;
            const mtype = Object.keys(data.message)[0];
            const mentions = message.quoted.mentions;

            // Send message with mention.
            if (query === 'tag') {
                var participants = groups[sent].participants.map((participant) => {
                    if (participant.type === 'superadmin' || participant.type === 'admin') return;
                    return participant.jid;
                }).filter((x) => x);
                mentions.concat(participants);
            }

            // Patch the message.
            data.message[data.type].contextInfo = { isForwarded: true, forwardingscore: 1, mentionedJid: data.mentions};
            const content = await baileys.generateWAMessageFromContent(groups[sent].id, data.message, { userJid: client.user.id });

            // Send the broadcast message.
            await client.relayMessage(groups[sent].id, content.message, { messageId: content.key.id, userJid: client.user.id }).then(() => {
                logger.info(`Broadcast message sent to ${groups[sent].subject} | ${groups[sent].id}`);
            }).catch((x) => {
                logger.error(`Error occured while sending broadcast message to ${groups[sent].subject} | ${groups[sent].id}`);
                logger.error(x);
            })
            sent++;
        }, 5000);
    }
}