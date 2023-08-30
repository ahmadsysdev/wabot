const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Converts audio or video data from one format to another using FFmpeg.
 *
 * @param {Buffer} buffer - Buffer containing the audio or video data.
 * @param {string[]} args - Additional arguments for FFmpeg.
 * @param {string} ext - Original file extension.
 * @param {string} _ext - Desired file extension after conversion.
 * @returns {Promise<{ data: Buffer, filename: string }>} - Promise resolving to converted data and filename.
 */
function ffmpeg(buffer, args = [], ext, _ext) {
    return new Promise(async (resolve, reject) => {
        try {
            const _path = path.join('.', 'temp', `${Date.now()}`);
            const tmp = `${_path}.${ext}`;
            const out = `${_path}.${_ext}`;
            await fs.promises.writeFile(tmp, buffer);
            spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
                .on('error', reject)
                .on('close', async (code) => {
                    try {
                        await fs.promises.unlink(tmp);
                        resolve({ data: await fs.promises.readFile(out), filename: out });
                    } catch (err) {
                        reject(err);
                    }
                });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Converts audio data to Opus format suitable for voice messages (PTT).
 *
 * @param {Buffer} buffer - Buffer containing the audio data.
 * @param {string} ext - Original file extension.
 * @returns {Promise<{ data: Buffer, filename: string }>} - Promise resolving to converted Opus audio data and filename.
 */
function toPTT(buffer, ext) {
    return ffmpeg(buffer, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus');
}

/**
 * Converts audio data to MP3 format.
 *
 * @param {Buffer} buffer - Buffer containing the audio data.
 * @param {string} ext - Original file extension.
 * @returns {Promise<{ data: Buffer, filename: string }>} - Promise resolving to converted MP3 audio data and filename.
 */
function toAudio(buffer, ext) {
    return ffmpeg(buffer, ['-vn', '-ac', '2', '-b:a', '128k', '-ar', '44100', '-f', 'mp3'], ext, 'mp3');
}

/**
 * Converts video data to MP4 format.
 *
 * @param {Buffer} buffer - Buffer containing the video data.
 * @param {string} ext - Original file extension.
 * @returns {Promise<{ data: Buffer, filename: string }>} - Promise resolving to converted MP4 video data and filename.
 */
function toVideo(buffer, ext) {
    return ffmpeg(buffer, ['-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4');
}

module.exports = {
    toAudio, toPTT,
    toVideo, ffmpeg,
};
