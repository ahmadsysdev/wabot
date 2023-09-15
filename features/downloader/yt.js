const path = require('path');
const { default: axios } = require("axios");
const { createWriteStream, stat, unlink } = require('fs');
const ytdl = require('ytdl-core');
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');

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

        // Get video details
        ytdl.getInfo(link).then((info) => {
            const { title, viewCount, publishDate, description } = info.videoDetails;
            const { name, user } = info.videoDetails?.author;
            const filepath = path.join('.', 'temp', `${title}.mp4`);
            const caption = `❏ *Title*: ${title}\n❏ *Publish date*: ${publishDate}\n❏ *Views*: ${viewCount}\n❏ *Channel name*: ${name}\n❏ *Username*: ${user}\n❏ *Description*: ${description}`;
            const tracker = {
                start: Date.now(),
                audio: { downloaded: 0, total: Infinity },
                video: { downloaded: 0, total: Infinity },
                merged: { frame: 0, speed: '0x', fps: 0 }
            }
            const audio = ytdl(link, { quality: 'highestaudio' }).on('progress', (_, downloaded, total) => {
                tracker.audio = { downloaded, total };
            })
            const video = ytdl(link, { quality: 'highestvideo' }).on('progress', (_, downloaded, total) => {
                tracker.video = { downloaded, total };
            })
            const process = spawn(ffmpeg, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:4',
                '-i', 'pipe:5',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Output file
                filepath
            ], {
                windowsHide: true,
                stdio: [
                    // Standard: stdin, stout, stderr
                    'inherit', 'inherit', 'inherit',
                    // Custom: pipe:3, pipe:4, pipe:5
                    'pipe', 'pipe', 'pipe'
                ]
            })
            process.on('close', async () => {
                // console.log('done')
                stat(filepath, async (err, stats) => {
                    if (err) {
                        return await client.sendMessage(message.from, { text: reply.error }, { quoted: message });
                    }
                    // 100MB
                    if (stats.size > 104857600) {
                        return unlink(filepath, async () => {
                            return await client.sendMessage(message.from, { text: 'File size too large'}, { quoted: message });
                        })
                    }
                    return await client.sendVideo(message.from, filepath, caption, message);
                })
                // await client.sendVideo(message.from, filepath, caption, message);
            })
            process.stdio[3].on('data', chunk => {
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (let i of lines) {
                    const [key, value] = i.split('=');
                    args[key.trim()] = value.trim();
                }
                tracker.merged = args;
            })
            audio.pipe(process.stdio[4]);
            video.pipe(process.stdio[5]);
        }).catch(async (err) => {
            logger.error(err);
            return await client.sendMessage(message.from, { text: err.message }, { quoted: message });
        })
    }
}