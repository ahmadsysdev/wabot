module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'pushctc',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['pushcontact', 'pc'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Send a message to all participants in the group.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'pro',

    /**
     * Wait message
     * @type {boolean}
     */
    wait: true,

    /**
     * Query message
     * @type {boolean}
     */
    query: true,
    
    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.baileys - Baileys library.
     */
    message: 'Kindly reply with the message you wish to announce.',
    async run(client, message, { baileys, logger, query }) {

        // Extract group metadata
        const metadata = await client.extractGroupMetadataJid(message.from);
        const participant = metadata.participant?.filter((value) => {
            return value.jid && value.jid !== client.decodeJid(client.user.id);
        });

        let sent = 0;
        // Iterate through participants and send the message
        const iteration = setInterval(async () => {
            if (participant.length <= sent) {
                // Inform the sender that the messages have been sent
                await client.sendMessage(message.from, { text: `Messages sent to all participants.\nTotal sent: ${sent} messages.` }, { quoted: message });
                return clearInterval(iteration);
            }
            // if (!participant[sent]?.jid || participant[sent].jid === client.decodeJid(client.user.id)) return sent++;

            // Send the messages
            var a = await client.sendMessage(participant[sent].jid, { text: query });
            sent++;
            logger.info(`Push contact: messages sent to ${participant[sent-1].jid} [${sent}]`);
        }, 10000);
    }
}