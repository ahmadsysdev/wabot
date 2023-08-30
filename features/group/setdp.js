const fs = require('fs');
const path = require('path');

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'setdp',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['setdp', 'setprofile', 'setpp'],

    /**
     * Command description.
     * @type {string}
     */
    desc: `For changing the group's profile picture.`,

    /**
     * Command category.
     * @type {string}
     */
    category: 'group',

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
     * Media settings for the command.
     * @type {Object}
     */
    media: { imageMessage: true },

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} param - The command parameters.
     */
    async run(client, message, { command, logger, reply }) {
        let image;
        const _path = path.join(__dirname, '..', '..', 'temp', Date.now() + '.png');

        if (message.quoted && message.quoted.mtype === 'imageMessage') {
            await message.quoted.download(_path);
            image = true;
        }

        if (message.type === 'imageMessage') {
            await message.download(_path);
            image = true;
        }

        if (!image) {
            return await client.sendMessage(message.from, { text: reply.imageError }, { quoted: message });
        }

        return client.updateProfilePicture(message.from, { url: _path })
            .then(() => {
                if (fs.existsSync(_path)) {
                    fs.unlinkSync(_path);
                }
            })
            .catch(async (x) => {
                if (fs.existsSync(_path)) {
                    fs.unlinkSync(_path);
                }
                logger.error(x);
                await client.sendMessage(message.from, { text: reply.error }, { quoted: message });
            });
    }
}