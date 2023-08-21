const path = require('path');
const { default: axios } = require("axios");
const { createWriteStream } = require('fs');

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'ytdl',

    /**
     * Command aliases.
     * @type {Object}
     */
    alias: ['ytdown', 'youtube', 'yt'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Youtube video downloader.',
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
    regex: /(?:https?:\/\/)?(?:[a-z]+\.)?(?:youtu\.be\/[^\s]+|(?:www\.|m\.)?youtube\.com\/[^\s]+)/gi,

    /**
     * Indicates if the command should wait for asynchronous actions to complete.
     * @type {boolean}
     */
    wait: true,

    /**
     * Message to display when no Instagram link is found.
     * @type {string}
     */
    message: { regex: `We couldn't find a YouTube link in the message.` },

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
     * @param {Object} options.reply - Reply message object.
     * @param {Object} options.regex - Regex object
     * @param {Object} options.queries - Command queries
     * @param {Object}
     */
    async run(client, message, { logger, reply, regex, queries }) {
        // Extract the YouTube link from the queries
        const link = queries.match(regex)?.[0];

        // Create axios instance
        const instance = axios.create({
            withCredentials: true,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Get video details
        const data = {k_query: link, k_page: 'home', hl: 'en', q_auto: '0'};
        instance.post('https://www.y2mate.com/mates/analyzeV2/ajax', data).then((response) => {
            const vid = response.data.vid;
            const res = response.data.links?.mp4;
            const channel = response.data.a;
            let int = 0;
            Object.keys(res).forEach((k) => {
                if (k > int) {
                    int = parseInt(k);
                }
            })
            const k = res[int].k;
            instance.post('https://www.y2mate.com/mates/convertV2/index', { vid, k }).then(async (response) => {
                if (response.data.c_status === 'CONVERTED') {
                    const { dlink, ftype, fquality, title } = response.data;
                    const caption = `Title: ${title}\nChannel: ${channel}\nFile type: ${ftype}\nVideo resolution: ${fquality}p`;
                    axios({
                        method: 'get',
                        url: dlink,
                        responseType: 'stream'
                    }).then(response => {
                        const filename = decodeURIComponent(response.headers['content-disposition'].match(/filename="(.+)"/)?.[1]);
                        const fullpath = path.join('.', 'temp', filename);

                        // Pipe the stream to a file and send the media
                        response.data.pipe(createWriteStream(fullpath).on('finish', async () => {
                            return await client.sendMedia(message.from, fullpath, caption, message);
                        }))
                    })
                }
                else if (response.data.c_status === 'FAILED') {
                    return await client.sendMessage(message.from, { text: reply.error }, { quoted: message });
                }
            })
        }).catch((err) => logger.error(err));
    }
}