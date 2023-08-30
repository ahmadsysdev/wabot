module.exports = {
	/**
	 * Name of the command.
	 */
	name: 'demote',
	/**
	 * Aliases for the command.
	 */
	alias: ['dm', 'dmt', 'unadmin'],
	/**
	 * Description of the command.
	 */
	desc: 'Demote another group admin to a regular member.',
	/**
	 * Usage information for the command.
	 */
	usage: '< mention/reply >',
	/**
	 * Category of the command.
	 */
	category: 'group',
	/**
	 * Indicates if this command only works within groups.
	 */
	isGroup: true,
	/**
	 * Indicates if the command requires admin privileges.
	 */
	isAdmin: true,
	/**
	 * Indicates if the bot must be a self-administrator to run this command.
	 */
	selfAdmin: true,
	/**
	 * Indicates if the command can take a mention as an argument.
	 */
	mention: true,

	/**
	 * The main function to run the command.
	 * @param {Object} client - The WhatsApp client instance.
	 * @param {Object} message - The message that triggered the command.
	 * @param {Object} options - The options passed to the command.
	 * @param {string} options.command - The name of the command.
	 * @param {Function} options.groupAdmins - A function to check if a participant is a group admin.
	 * @param {string} options.selfId - The ID of the bot.
	 * @param {string} options.query - The query argument of the command.
	 */
	async run(client, message, { command, groupAdmins ,selfId, query, reply }) {
		// Determine the participants to demote
		let participants = ((message.mentions && message.mentions[0]) ? message.mentions : (message.quoted ? [message.quoted.sender] : [query.replace(/[^0-9]/g, "") + "@s.whatsapp.net"])).filter((x) => {
			if (x === '@s.whatsapp.net') return;
			if (x === selfId) {
				// Prevent demoting the bot itself
				return client.sendMessage(message.from, { text: reply.demoteSelfError }, { quoted: message }).then(() => void 0);
			}
			return true;
		});

		// Check if participants were provided
		if (!participants || !participants[0]) {
			return await client.sendMessage(message.from, { text: `Usage: *${command} < mention/reply >`}, { quoted: message });
		}

		// Demote the selected participants
		for (let i of participants) {
			if (i === selfId) continue;
			if (!groupAdmins(i)) {
				// Check if the participant is an admin
				await client.sendMessage(message.from, { text: reply.notAdminError.replace('@user', '@'+i.split('@')[0]), withTag: true }, { quoted: message });
				continue;
			}

			// Demote the participant
			client.groupParticipantsUpdate(message.from, [i], 'demote')
				.then(async () => await client.sendMessage(message.from, { text: reply.done }, { quoted: message }))
				.catch(async () => await client.sendMessage(message.from, { text: reply.error }, { quoted: message }));
		}
	},
};