const fs = require("fs");
const { spawn } = require("child_process");
const ff = require("fluent-ffmpeg");

/**
 * Creates Exif metadata for a sticker pack and writes it to a file.
 *
 * @param {string} pack - The name of the sticker pack.
 * @param {string} auth - The name of the pack's author/publisher.
 * @returns {string} - Path to the generated Exif metadata file.
 */
exports.createExif = (pack, auth) => {
    const code = [0x00, 0x00, 0x16, 0x00, 0x00, 0x00];
    const exif = {
        "sticker-pack-id": "com.client.tech",
        "sticker-pack-name": pack,
        "sticker-pack-publisher": auth,
        "android-app-store-link": "https://wa.me/601137154214",
        "ios-app-store-link": "https://wa.me/601137154214",
    };
    let len = JSON.stringify(exif).length;
    if (len > 256) {
        len = len - 256;
        code.unshift(0x01);
    } else {
        code.unshift(0x00);
    }
    if (len < 16) {
        len = len.toString(16);
        len = "0" + len;
    } else {
        len = len.toString(16);
    }
    const f = Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]);
    const ff = Buffer.from(len, "hex");
    const fff = Buffer.from(code);
    const ffff = Buffer.from(JSON.stringify(exif));
    const filePath = "./temp/data.exif";
    
    fs.writeFileSync(filePath, Buffer.concat([f, ff, fff, ffff]), (err) => {
        if (err) return console.log(err);
        return filePath;
    });

    return filePath;
};

/**
 * Embeds Exif metadata into a sticker image and sends it.
 *
 * @param {string} media - Path to the sticker image file.
 * @param {object} client - WhatsApp client object.
 * @param {object} msg - WhatsApp message object.
 */
exports.exifStick = (media, client, msg) => {
    const from = msg.from;
    output = Date.now() + ".webp";
    try {
        spawn("webpmux", ["-set", "exif", "./temp/data.exif", media, "-o", output])
            .on("exit", () => {
                client.sendMessage(from, { sticker: fs.readFileSync(output) }, { quoted: msg });
                fs.unlinkSync(output);
                fs.unlinkSync(media);
            });
    } catch (err) {
        console.log(err);
        client.sendMessage(from, { text: "Something went wrong!" }, { quoted: msg.messages.all()[0] });
        fs.unlinkSync(media);
    }
};

/**
 * Adds Exif metadata to a media file, converts it to a sticker with specified FPS, and sends it.
 *
 * @param {string} media - Path to the media file.
 * @param {object} client - WhatsApp client object.
 * @param {object} msg - WhatsApp message object.
 * @param {string} from - Source of the message.
 * @param {number} fps - Frames per second for the sticker animation.
 */
exports.exifMedia = (media, client, msg, from, fps) => {
    output = Date.now() + ".webp";
    try {
        ff(media)
            .on("error", (err) => {
                console.log(err);
                client.sendMessage(from, { text: "Something went wrong!" }, { quoted: msg });
                fs.unlinkSync(media);
            })
            .on("end", () => {
                _output = Date.now() + ".webp"; // Fixed the assignment typo
                spawn("webpmux", ["-set", "exif", "./temp/data.exif", _output])
                    .on("exit", () => {
                        client.sendMessage(from, { sticker: fs.readFileSync(_output) }, { quoted: msg });
                        fs.unlinkSync(output);
                        fs.unlinkSync(_output);
                        fs.unlinkSync(media);
                    });
            })
            .addOutputOptions([
                "-vcodec", "libwebp", "-vf",
                `scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=${fps}, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`,
            ])
            .toFormat("webp")
            .save(output);
    } catch (err) {
        console.log(err);
        client.sendMessage(from, { text: "Something went wrong!" }, { quoted: msg });
        fs.unlinkSync(media);
    }
};