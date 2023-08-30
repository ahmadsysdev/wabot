const path = require('path');
const { default: axios } = require("axios");
const { createWriteStream } = require('fs');
const ytdl = require('ytdl-core');
const Ffmpeg = require('fluent-ffmpeg');

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'yt2mp3',

    /**
     * Command aliases.
     * @type {Object}
     */
    alias: ['ytmp3'],

    /**
     * Command description.
     * @type {string}
     */
    desc: 'Convert YouTube videos to audio MP3.',
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

        // Get video details
        ytdl.getInfo(link).then((info) => {
            const { title } = info.videoDetails;
            const filepath = path.join('.', 'temp', `${title}.mp3`);
            const stream = ytdl(link, { quality: 'highestaudio' });
            Ffmpeg(stream).audioBitrate(128).save(filepath).on('end', async () => {
                return await client.sendMedia(message.from, filepath, undefined, message)
            }).on('error', async (err) => {
                logger.error(err);
                return await client.sendMessage(message.from, { text: reply.error }, { quoted: message });
            });
        }).catch(async (err) => {
            logger.error(err);
            return await client.sendMessage(message.from, { text: err.message }, { quoted: message });
        })
    }
}