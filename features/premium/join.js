module.exports = {
	/**
	 * Name of the command.
	 */
	name: 'join',
	/**
	 * Aliases for the command.
	 */
	alias: ['accept'],
	/**
	 * Description of the command.
	 */
	desc: 'Join groups using the provided group link invitations.',
	/**
	 * Category of the command.
	 */
	category: 'premium',
	/**
	 * Usage syntax for the command.
	 */
	usage: '< link/reply >',
	/**
	 * Indicates if this command requires premium access.
	 */
	isPremium: true,
	/**
	 * Regular expression pattern to match group invitation links.
	 */
	regex: /chat.whatsapp.com\/([\w\d]*)/gi,
	/**
	 * Indicates if this command requires a query parameter.
	 */
	param: true,
	/**
	 * The message to display when no group invitation link is detected.
	 */
	message: { regex: `We couldn't detect any group invitation link. Please reply or send a message with a valid group link invitation.` },
	example: '@cmd https://chat.whatsapp.com/xxxxxxx',
	/**
	 * The main function to run the command.
	 * @param {Object} client - The WhatsApp client instance.
	 * @param {Object} message - The message that triggered the command.
	 * @param {Object} options - The options passed to the command.
	 * @param {string} options.queries - The queries extracted from the message.
	 * @param {string} options.command - The command name.
	 * @param {RegExp} options.regex - The regular expression pattern.
	 */
	async run(client, message, { queries, command, regex, logger, reply }) {
		queries = queries.match(regex);
		let code = queries[0].replace('chat.whatsapp.com/', '');
		const checkInvite = await client.checkInviteCode(code);
		if (!checkInvite) {
			return await client.sendMessage(message.from, { text: reply.invalidInviteCode }, { quoted: message });
		}
		return client.groupAcceptInvite(code).then(async (x) => {
            logger.info(`Participating in the group through the invite link from ${message.sender} (${x})`);
			await client.chatModify({ mute: 8 * 60 * 60 * 1000 }, x, []);
			return await client.sendMessage(message.from, { text: reply.done }, { quoted: message });
		});
	}
}