module.exports = {
	/**
	 * Name of the command.
	 */
	name: 'delete',
	/**
	 * Aliases for the command.
	 */
	alias: ['del', 'delt', 'dlt'],
	/**
	 * Description of the command.
	 */
	desc: 'To remove a sent message. Can also delete messages from other participants (requiring admin privileges).',
	/**
	 * Usage information for the command.
	 */
	use: '< reply >',
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
	 * Indicates if the command requires a quoted message.
	 */
	isQuoted: true,

	/**
	 * The main function to run the command.
	 * @param {Object} client - The WhatsApp client instance.
	 * @param {Object} message - The message that triggered the command.
	 * @param {Object} options - The options passed to the command.
	 * @param {boolean} options.selfAdmin - Indicates if the bot is a self-administrator.
	 */
	async run(client, message, { selfAdmin }) {
		const { quoted } = message;
		if (quoted.self) {
			// Delete the quoted message and the triggering message
			client.sendMessage(message.from, { delete: quoted.key })
				.then(async () => {
                    if (selfAdmin) {
                        await client.sendMessage(message.from, { delete: message.key });
                    }
                })
				.catch(() => client.sendMessage(message.from, { text: 'An error occurred.' }, { quoted: message }).then(() => void 0));
		} else {
			if (!selfAdmin) {
				return await client.sendMessage(message.from, { text: "In order to delete the message, I need to have admin privileges." }, { quoted: message });
			}
			// Delete the quoted message and the triggering message (admin required)
			client.sendMessage(message.from, { delete: quoted.key })
				.then(() => client.sendMessage(message.from, { delete: message.key }).then(() => void 0))
				.catch(() => client.sendMessage(message.from, { text: 'An error occurred.' }, { quoted: message }).then(() => void 0));
		}
	}
}