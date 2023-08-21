const path = require('path');
const axios = require("axios");
const { createWriteStream } = require('fs');

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'instadown',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['snapinsta', 'igdown'],

    /**
     * Command description.
     * @type {string}
     */
    description: 'Instagram media downloader.',

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
    regex: /((https?:\/\/)?(www.)?instagram.com\/[^\s]+)/g,

    /**
     * Indicates if the command should wait for asynchronous actions to complete.
     * @type {boolean}
     */
    wait: true,

    /**
     * Message to display when no Instagram link is found.
     * @type {string}
     */
    message: { regex: `We couldn't find a Instagram link in the message.` },

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
        // Extract the Instagram link from the queries
        const link = queries.match(regex)?.[0];

        // Create an axios instance with credentials
        const instance = axios.create({ withCredentials: true });

        // Make a GET request to fetch the token and set cookies
        instance.get('https://indown.io/').then((response) => {
            const _token = response.data.match(/<input[^>]+name="_token[^>]+value="([^"]+)/)?.[1];
            instance.defaults.headers.Cookie = response.headers['set-cookie'];

            // Make a POST request to initiate the download
            instance.post('https://indown.io/download', {
                referer: 'https://indown.io',
                locale: 'en',
                link,
                _token
            }).then((response) => {
                const media = response.data.match(/<a[^>]+href="(https:\/\/scontent[^"]+)/)?.[1].replace(/&amp;/g, '&');

                // Download the media using axios and stream it to a file
                axios({
                    method: 'get',
                    url: media,
                    responseType: 'stream'
                }).then((response) => {
                    const filename = path.basename(media).match(/([^?]+)/)?.[1];
                    const fullpath = path.join('.', 'temp', filename);

                    // Pipe the stream to a file and send the media to the user
                    response.data.pipe(createWriteStream(fullpath)).on('finish', async () => {
                        return await client.sendMedia(message.from, fullpath, reply.done, message);
                    });
                });
            });
        }).catch((error) => logger.error(error));
    }
};