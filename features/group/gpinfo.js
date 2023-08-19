module.exports = {
	/**
	 * Name of the command.
	 */
	name: 'groupinfo',
	/**
	 * Aliases for the command.
	 */
	alias: ['gpinfo', 'gpin'],
	/**
	 * Description of the command.
	 */
	desc: 'Retrieve data about the chat group, encompassing group subject, owner details, description, group ID, and more.',
    /**
	 * Usage information for the command.
	 */
	usage: '[ group link ]',
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
	 * The main function to run the command.
	 * @param {Object} client - The WhatsApp client instance.
	 * @param {Object} message - The message that triggered the command.
	 * @param {Object} options - The options passed to the command.
	 * @param {Object} options.groupMetadata - The metadata of the group.
	 * @param {string} options.query - The query argument of the command.
	 */
	async run(client, message, { groupMetadata, query, reply }) {
		const regex = /chat.whatsapp.com\/([\w\d]*)/gi;

		// Check if the query is a group invitation link
		query = query ? query.match(regex) : message.quoted && message.quoted.text && message.quoted.text.match(regex);
		if (query) {
			const code = query[0].replace('chat.whatsapp.com/', '');
			const validation = await client.checkInviteCode(code);

			if (!validation) {
				return await client.sendMessage(message.from, { text: 'Invalid group invitation link!' }, { quoted: message });
			}

			const metadata = await client.extractGroupMetadataCode(validation);

			const text = ['◪ *GROUP INFORMATION*\n'];
			text.push(`❏ Owner: 「 @${metadata.creator ? metadata.creator.split('@')[0] : "Unable to fetch creator"} 」`);
			text.push(`❏ Creation: 「 ${require('moment')(metadata.creation * 1000).format('dddd, MMMM Do YYYY HH:mm:ss')} 」`);
			text.push([`❏ Subject: 「 ${metadata.subject} 」`]);
			text.push(`❏ Subject edited by: 「 @${metadata.s_o.split('@')[0]} 」`);
			text.push(`❏ Subject edited time: 「 ${require('moment')(metadata.s_t * 1000).format('dddd, MMMM Do YYYY HH:mm:ss')} 」`);
			text.push(`❏ Description: 「 ${metadata.desc || 'No description'} 」`);
			text.push(`❏ Description edited by: 「 ${metadata.d_o && '@' + metadata.d_o.split('@')[0] || 'No description'} 」`);
			text.push(`❏ Description edited time: 「 ${metadata.d_t && require('moment')(metadata.d_t * 1000).format('dddd, MMMM, Do YYYY HH:mm:ss') || 'No description'} 」`);

			if (metadata.participant[0]) {
				let count = 0;
				text.push('\n◪ Participants:');
				metadata.participant.forEach((x) => {
					if (!x.jid) return;
					count += 1;
					text.push(`	${count}) ❏ @${x.jid.split('@')[0]}`);
				});
			}

			return await client.sendMessage(message.from, { text: text.join('\n'), withTag: true }, { quoted:  message });
		}

		if (message.from == '601161528902-1604572322@g.us') {
			return  await client.sendMessage(message.from, { text: 'Action denied!' }, { quoted: message });
		}

		const text = ['◪ *GROUP INFORMATION*\n'];
		text.push(`❏ Owner: 「 @${groupMetadata.creator ? groupMetadata.creator.split('@')[0] : "Unable to fetch creator"} 」`);
		text.push(`❏ Creation: 「 ${require('moment')(groupMetadata.creation * 1000).format('dddd, MMMM Do YYYY HH:mm:ss')} 」`);
		text.push([`❏ Subject: 「 ${groupMetadata.subject} 」`]);
		text.push(`❏ Subject edited by: 「 @${groupMetadata.s_o.split('@')[0]} 」`);
		text.push(`❏ Subject edited time: 「 ${require('moment')(groupMetadata.s_t * 1000).format('dddd, MMMM Do YYYY HH:mm:ss')} 」`);
		text.push(`❏ Description: 「 ${groupMetadata.desc || 'No description'} 」`);
		text.push(`❏ Description edited by: 「 ${groupMetadata.d_o && '@' + groupMetadata.d_o.split('@')[0] || 'No description'} 」`);
		text.push(`❏ Description edited time: 「 ${groupMetadata.d_t && require('moment')(groupMetadata.d_t * 1000).format('dddd, MMMM, Do YYYY HH:mm:ss') || 'No description'} 」`);

		return await client.sendMessage(message.from, { text: text.join('\n'), withTag: true }, { quoted: message });
	}
}