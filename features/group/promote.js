module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'promote',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['pm', 'prmt'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Give admin privileges to standard users',

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

    /**
     * Command usage.
     * @type {string}
     */
    usage: '< mention/reply >',

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
     * Indicates if the bot itself must be an admin.
     * @type {boolean}
     */
    selfAdmin: true,

    /**
     * Indicates if the command uses mentions.
     * @type {boolean}
     */
    mention: true,

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options - Options for the command.
     * @param {string} options.command - The command being executed.
     * @param {string} options.selfId - The ID of the bot itself.
     * @param {function} options.groupAdmins - Function to check if a participant is an admin.
     * @param {string} options.query - The user input/query.
     */
    async run(client, message, { command, selfId, groupAdmins, query, reply }) {
        let participant = ((message.mentions && message.mentions[0]) ? message.mentions : (message.quoted ? [message.quoted.sender] : [query.replace(/[^0-9]/g, "") + "@s.whatsapp.net"])).filter((x) => {
            if (x === '@s.whatsapp.net') return;
            return true;
        });

        if (participant.length === 0) {
            return await client.sendMessage(message.from, { text: `Usage: *${command} < mention/reply >` }, { quoted: message });
        }

        for (let i of participant) {
            if (i === selfId) {
                continue;
            }

            if (groupAdmins(i)) {
                await client.sendMessage(message.from, { text: reply.alreadyAdmin.replace('@user', i.split('@')[0]), withTag: true }, { quoted: message });
                continue;
            }

            client.groupParticipantsUpdate(message.from, [i], 'promote')
                .then(async () => await client.sendMessage(message.from, { text: reply.done }, { quoted: message }))
                .catch(async () => await client.sendMessage(message.from, { text: reply.error }, { quoted: message }));
        }
    }
}