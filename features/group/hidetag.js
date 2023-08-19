module.exports = {
	/**
	 * Name of the command.
	 */
	name: 'hidetag',
	/**
	 * Aliases for the command.
	 */
	alias: ['ht', 'hmention'],
	/**
	 * Description of the command.
	 */
	desc: 'Mention all participants without using specific tags.',
	/**
	 * Category of the command.
	 */
	category: 'group',
	/**
	 * Usage syntax for the command.
	 */
	usage: '[ text/reply ]',
	/**
	 * Indicates if this command only works within groups.
	 */
	isGroup: true,
	/**
	 * Indicates if the command requires admin privileges.
	 */
	isAdmin: true,
	example: '@cmd Hello world!',
	/**
	 * The main function to run the command.
	 * @param {Object} client - The WhatsApp client instance.
	 * @param {Object} message - The message that triggered the command.
	 * @param {Object} options - The options passed to the command.
	 * @param {string} options.query - The query argument of the command.
	 * @param {Object} options.groupMetadata - The metadata of the group.
	 * @param {string} options.selfId - The ID of the bot itself.
	 * @param {import('@whiskeysockets/baileys').Baileys} options.baileys - The Baileys instance.
	 */
	async run(client, message, { query, groupMetadata, selfId, baileys, reply }) {
		if (message.quoted) {
			let options = [];
			const content = db.check('db', message.quoted.stanzaId, 'id');
			if (!content) {
				return await client.sendMessage(message.from, { text: RemotePlayback.notFound }, { quoted: message });
			}

			const mtype = Object.keys(content.message.message)[0];
			const mentions = content.message.message[mtype].contextInfo
				? (content.message.message[mtype].contextInfo.mentionedJid || [])
				: [];
			mentions.push(...groupMetadata.participant.map((x) => x.jid));

			return await client.sendMessage(message.from, { forward: content.message, mentions });
		}
		else {
			let mentions = message.mentions || (message.message[message.type].contextInfo && message.message[message.type].contextInfo.mentionedJid) || [];
			mentions.push(...groupMetadata.participant.map((x) => x.jid));

			message.message[message.type].caption
				? (message.message[message.type].caption = query)
				: message.message[message.type].text
					? (message.message[message.type].text = query)
					: message.message.conversation
						? (message.message.conversation = query)
						: void 0;

			return await client.sendMessage(message.from, { forward: message, mentions });
		}
	}
}