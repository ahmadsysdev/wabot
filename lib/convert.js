const path = require('path');
const fs = require('fs');
const mpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(mpegPath);
const run = require('child_process').exec;

/**
 * Creates Exif metadata for a sticker and writes it to a file.
 *
 * @param {string} packname - The name of the sticker pack.
 * @param {string} author - The name of the pack's author/publisher.
 * @param {string} [filename='data'] - Name of the Exif metadata file to be created.
 * @param {string} [emoji='😁'] - Emoji to associate with the sticker.
 */
function createStick(packname, author, filename = 'data', emoji = '😁') {
    const data = {
        'sticker-pack-id': 'com.snowcorp.stickerly.android.stickercontentprovider b5e7275f-f1de-4137-961f-57becfad34f2',
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'android-app-store-link': '',
        'ios-app-store-link': '',
        emojis: [emoji],
    };
    let len = new TextEncoder().encode(JSON.stringify(data)).length;
    const f = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]);
    const code = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00];
    if (len > 256) {
        len = len - 256;
        code.unshift(0x01);
    } else {
        code.unshift(0x00);
    }
    const fff = Buffer.from(code);
    const ffff = Buffer.from(JSON.stringify(data));
    if (len < 16) {
        len = len.toString(16);
        len = '0' + len;
    } else {
        len = len.toString(16);
    }
    const ff = Buffer.from(len, 'hex');
    const buffer = Buffer.concat([f, ff, fff, ffff]);
    fs.writeFileSync(path.join('.', 'temp', filename + '.exif'), buffer, (err) => {
        if (err) return console.log(err);
        console.log('Success.');
    });
}

/**
 * Converts a media file to another format using ffmpeg.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} extF - Original file extension.
 * @param {string} extS - Desired file extension after conversion.
 * @param {string[]} [args=[]] - Additional arguments for ffmpeg conversion.
 * @returns {Promise<Buffer>} - Promise resolving to the converted media file buffer.
 */
function convert(file, extF, extS, args = []) {
    return new Promise(async (resolve, reject) => {
        const _a = path.join('.', 'temp', `${Date.now()}`);
        let output = `${_a}.${extS}`;
        ffmpeg(file)
            .on('error', (err) => {
                fs.existsSync(file) && fs.unlinkSync(file);
                reject(err);
            })
            .on('end', () => {
                setTimeout(() => {
                    fs.existsSync(file) && fs.unlinkSync(file);
                    fs.unlinkSync(output);
                }, 2000);
                resolve(fs.readFileSync(output));
            })
            .addOutputOptions(args)
            .toFormat(extS)
            .save(output);
    });
}

/**
 * Converts a media file to another format using ffmpeg.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} extF - Original file extension.
 * @param {string} extS - Desired file extension after conversion.
 * @param {string[]} [args=[]] - Additional arguments for ffmpeg conversion.
 * @returns {Promise<Buffer>} - Promise resolving to the converted media file buffer.
 */
async function converts(file, extF, extS, args = []) {
    return new Promise(async (resolve, reject) => {
        const _a = path.join('.', 'temp', `${Date.now()}`);
        let output = `${_a}.${extS}`;
        ffmpeg(file)
            .on('error', (err) => {
                fs.existsSync(file) && fs.unlinkSync(file);
                reject(err);
            })
            .on('end', () => {
                setTimeout(() => {
                    fs.existsSync(file) && fs.unlinkSync(file);
                    fs.unlinkSync(output);
                }, 2000);
                resolve(fs.readFileSync(output));
            })
            .addOutputOptions(args)
            .seekInput('00:00')
            .setDuration('00:05')
            .toFormat(extS)
            .save(output);
    });
}

/**
 * Converts a media file to MP4 video format.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} ext - Original file extension.
 * @returns {Promise<Buffer>} - Promise resolving to the converted video file buffer.
 */
async function toVideo(file, ext) {
    return convert(file, ext, 'mp4', [
        '-c:a aac', '-c:v libx264',
        '-ab 128K', '-ar 44100',
        '-crf 32', '-preset slow']);
}

/**
 * Converts a media file to MP3 audio format.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} ext - Original file extension.
 * @returns {Promise<Buffer>} - Promise resolving to the converted audio file buffer.
 */
async function toAudio(file, ext) {
    return convert(file, ext, 'mp3', [
        '-vn', '-b:a 192k',
        '-ar 44100', '-ac 2']);
}

/**
 * Converts a media file to Opus audio format.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} ext - Original file extension.
 * @returns {Promise<Buffer>} - Promise resolving to the converted Opus audio file buffer.
 */
async function toOpus(file, ext) {
    return convert(file, ext, 'opus', [
        '-vn', '-c:a libopus',
        '-b:a 128K', '-vbr on',
        '-compression_level 10']);
}

/**
 * Generates stickers based on the provided media file and options.
 *
 * @param {Buffer|string} file - The input media file or file path.
 * @param {object} options - Options for generating stickers.
 * @param {boolean} [options.isImage=false] - Indicates if the file is an image.
 * @param {boolean} [options.isVideo=false] - Indicates if the file is a video.
 * @param {boolean} [options.isSticker=false] - Indicates if the file is a sticker.
 * @param {boolean} [options.withPackInfo=false] - Indicates if pack info is included.
 * @param {object} [options.packInfo] - Information about the sticker pack.
 * @param {string} options.cmdType - Command type for generating the sticker.
 * @returns {Promise<Buffer>} - Promise resolving to the generated sticker buffer.
 */
async function sticker(file, options) {
    const filename = './temp/' + Date.now();
    let exts;
    if (options.isImage) exts = 'jpg';
    if (options.isVideo) exts = 'mp4';
    if (options.isSticker) exts = 'webp';
    const filepath = filename + '.' + exts;
    // Convert file to a path if it's a buffer
    Buffer.isBuffer(file) ? (fs.writeFileSync(filepath, file), file = filepath) : void 0;
    
    // Set default command type if not provided
    if (typeof options.cmdType === 'undefined') options.cmdType = '1';
    
    const cmd = {
        1: [
            '-fs 1M', '-vcodec',
            'libwebp', '-vf',
            'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
        ],
        2: ['-fs 1M', '-vcodec', 'libwebp'],
    };

    if (options.withPackInfo) {
        if (!options.packInfo) throw Error('Null argument: packInfo');
        let ext = options.isImage !== undefined || false ? 'jpg' : options.isVideo !== undefined || false ? 'mp4' : null;
        return stickerWithExif(file, ext, options.packInfo, cmd[parseInt(options.cmdType)]);
    }
    if (options.isImage) {
        return convert(file, 'jpg', 'webp', cmd[parseInt(options.cmdType)]);
    } else if (options.isSticker) {
        return convert(file, 'webp', 'webp', cmd[parseInt(options.cmdType)]);
    } else if (options.isVideo) {
        return converts(file, 'mp4', 'webp', cmd[parseInt(options.cmdType)]);
    }
}

/**
 * Generates a sticker based on the provided media file and arguments.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} ext - Original file extension.
 * @param {string[]} [args=[]] - Additional arguments for sticker generation.
 * @returns {Promise<string>} - Promise resolving to the path of the generated sticker.
 */
function generate(file, ext, args = []) {
    const _a = path.join('.', 'temp', `${Date.now()}`);
    let output = `${_a}.webp`;
    if (ext === 'jpg') {
        return new Promise(async (resolve, reject) => {
            ffmpeg(file)
                .on('error', (err) => {
                    reject(err);
                })
                .on('end', () => {
                    fs.existsSync(file) && fs.unlinkSync(file);
                    resolve(output);
                })
                .addOutputOptions(args)
                .toFormat('webp')
                .save(output);
        });
    } else {
        return new Promise(async (resolve, reject) => {
            ffmpeg(file)
                .on('error', (err) => {
                    reject(err);
                })
                .on('end', () => {
                    fs.existsSync(file) && fs.unlinkSync(file);
                    resolve(output);
                })
                .addOutputOptions(args)
                .seekInput('00:00')
                .setDuration('00:05')
                .toFormat('webp')
                .save(output);
        });
    }
}

/**
 * Generates a sticker with Exif metadata based on the provided media file, info, and commands.
 *
 * @param {string} file - Path to the input media file.
 * @param {string} ext - Original file extension.
 * @param {object} info - Information about the sticker pack.
 * @param {string[]} cmd - Command for generating the sticker.
 * @returns {Promise<Buffer>} - Promise resolving to the generated sticker buffer.
 */
function stickerWithExif(file, ext, info, cmd) {
    return new Promise(async (resolve, reject) => {
        let { packname, author } = info;
        const filename = Date.now();
        const sticker = await generate(file, ext, cmd);
        createStick(
            packname ? packname : 'Original',
            author ? author : 'Sticker Maker',
            filename
        );
        run(
            `webpmux -set exif ./temp/${filename}.exif ${sticker} -o ${sticker}`,
            async (err) => {
                if (err) {
                    reject(err) && (await Promise.all([
                        fs.unlink(sticker),
                        fs.unlink(`./temp/${filename}.exif`),
                    ]));
                }
                setTimeout(() => {
                    fs.unlinkSync(sticker);
                    fs.unlinkSync(`./temp/${filename}.exif`);
                }, 2000);
                resolve(fs.readFileSync(sticker));
            }
        );
    });
}

module.exports = {
    toVideo, toAudio, toOpus, sticker, convert, converts, stickerWithExif
};
