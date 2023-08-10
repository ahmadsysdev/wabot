module.exports = {
	/**
	 * Name of the command.
	 */
	name: 'antiview',
	/**
	 * Aliases for the command.
	 */
	alias: ['antiviewonce', 'viewonce', 'vw'],
	/**
	 * Description of the command.
	 */
	desc: 'If a participant sends a view-once message within the group, the message will be forwarded and automatically converted into a normal message.',
	/**
	 * Usage information for the command.
	 */
	use: '< on/off >',
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
	 * Options for the command.
	 */
	option: ['on', 'off'],

	/**
	 * The main function to run the command.
	 * @param {Object} client - The WhatsApp client instance.
	 * @param {Object} message - The message that triggered the command.
	 * @param {Object} args - The command arguments.
	 * @param {string} args.arg - The argument provided with the command.
	 * @param {string} args.command - The name of the command used.
	 */
	async run(client, message, { arg, command }) {
		// Check if antiview is enabled for the group
		const data = db.check('antiview', message.from, 'id');
		const content = { id: message.from };
		// Toggle antiview based on the provided argument
		var turn = data ? (arg === 'on' ? void 0 : db.delete('antiview', message.from, 'id')) : (arg === 'on' ? db.modified('antiview', content) : void 0);

		// Return appropriate response based on the action
		if (!turn) {
			return await client.sendMessage(message.from, { text: `Anti viewonce message has been turned ${arg} before.` }, { quoted: message });
		} else {
			return await client
        }
    }
}