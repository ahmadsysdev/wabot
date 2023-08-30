const path = require('path');
const { default: axios } = require("axios");
const { createWriteStream } = require('fs');

module.exports = {
    name: 'tikdown',
    /**
     * Command aliases
     * @type {Object}
     */
    alias: ['tiktokdl', 'tikdl'],
    /**
     * Command description.
     * @type {string}
     */
    description: 'Tiktok video downloader.',

    /**
     * Command category.
     * @type {string}
     */
    category: 'downloader',

    /**
     * Command usage.
     * @type {string}
     */
    usage: '< link/reply >',

    /**
     * Regular expression to match Instagram links.
     * @type {RegExp}
     */
    regex: /https?:\/\/(?:www\.)?(?:vt\.)?tiktok\.com\/[^\s]+/i,

    /**
     * Indicates if the command should wait for asynchronous actions to complete.
     * @type {boolean}
     */
    wait: true,

    /**
     * Message to display when no Instagram link is found.
     * @type {string}
     */
    message: { regex: `We couldn't find a TikTok link in the message.` },

    /**
     * Indicates if this command requires parameter.
     * @type {boolean}
     */
    param: true,
    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.logger - Logger instance.
     */
    async run(client, message, { queries, regex, logger, reply }) {
        // Extract the TikTok link from the queries
        const link = queries.match(regex)?.[0];

        // Create an axios instance with credentials
        const instance = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36'
            }
        });

        // Make get request to fetch the token and set the cookies
        instance.get('https://ssstik.io/en').then((response) => {
            const token = response.data.match(/tt:'([^']+)/);

            // Form data
            const data = new FormData();
            data.append('id', link);
            data.append('locale', 'en');
            data.append('tt', token[1]);

            // Make a post rerquest to initiate the download
            instance.post('https://ssstik.io/abc?url=dl', data).then((response) => {
                const media = response.data.match(/<a href="(https:\/\/tikcdn.io[^"]+)/)?.[1];

                if (media) {
                    // Download the media
                    axios({
                        method: 'get',
                        url: media,
                        responseType: 'stream'
                    }).then(response => {
                        const filename = response.headers['content-disposition'].match(/filename=(.+)/)?.[1];
                        const fullpath = path.join('.', 'temp', filename);

                        // Pipe the stream to a file and send the media
                        response.data.pipe(createWriteStream(fullpath)).on('finish', async () => {
                            return await client.sendMedia(message.from, fullpath, reply.done, message);
                        })
                    })
                }
            })
        }).catch(e => logger.error(e));
    }
}