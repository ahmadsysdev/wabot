const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

/**
 * Writes content to a file and creates any necessary directories in the path.
 * @param {string} path - The path of the file to be written.
 * @param {string} content - The content to be written to the file.
 */
exports.writeFile = (path, content = '') => {
    if (!path) return; // If the path is not provided, return immediately.

    // Split path into directories
    const dirs = path.replace(/\\/g, '/').split('/');
    let filepath = '';

    // Iterate through directories to create them
    for (let dir of dirs) {
        filepath += dir + '/';
        
        // Continue if the directory already exists or if it's an empty segment
        if (fs.existsSync(filepath) || dir === '') continue;
        
        // If the current directory is the last one, write the content to a file
        if (dir === dirs[dirs.length - 1]) {
            fs.writeFileSync(filepath.replace(/\/$/, ''), content);
            break;
        }
        
        // Create a directory
        fs.mkdirSync(filepath);
    }
};


/**
 * Downloads content from a message and optionally saves it to a file.
 * @param {object} message - The message containing the content to be downloaded.
 * @param {string} _path - (Optional) The path where the content should be saved as a file.
 * @returns {Promise<string|Buffer>} - A promise that resolves to the saved file path (if _path is provided) or a buffer containing the downloaded content.
 */
exports.download = (message, _path) => {
    return new Promise(async (resolve, reject) => {
        let type = Object.keys(message)[0];
        const mime = {
            imageMessage: 'image', videoMessage: 'video',
            stickerMessage: 'sticker', documentMessage: 'document',
            audioMessage: 'audio'
        };

        // Handle different message types
        if (type === 'templateMessage') {
            message = message.templateMessage?.hydratedFourRowTemplate;
            type = Object.keys(message)[0];
        }
        if (type === 'buttonsMessage') {
            message = message.buttonsMessage;
            type = Object.keys(message)[0];
        }

        try {
            // Download content from the message
            const stream = await downloadContentFromMessage(message[type], mime[type]);
            let buffer = Buffer.from([]);

            // Accumulate the content in a buffer
            for await (let chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Write to a file if _path is provided, otherwise return the buffer
            if (_path) {
                await fs.promises.writeFile(_path, buffer);
                resolve(_path);
            }
            resolve(buffer);
        } catch (err) {
            reject(err);
        }
    })
}

/**
 * Recursively deletes a directory and its contents.
 * @param {string} dirPath - Path to the directory to be deleted.
 * @returns {boolean} - `true` if the directory was successfully deleted, `false` if an error occurred.
 */
exports.deleteDirectory = async (dirPath) => {
    try {
        // Get the list of items (files and subdirectories) within the directory
        const items = await fs.promises.readdir(dirPath);

        // Loop through each item and remove it (file or subdirectory)
        for (const item of items) {
            const itemPath = path.join(dirPath, item);

            // Check if the item is a directory
            const itemStats = await fs.promises.stat(itemPath);
            if (itemStats.isDirectory()) {
                // Recursively delete the subdirectory
                await deleteDirectory(itemPath);
            } else {
                // Delete the file
                await fs.promises.unlink(itemPath);
            }
        }

        // After all items are deleted, remove the empty directory
        await fs.promises.rmdir(dirPath);
        return true;
    } catch (error) {
        return;
    }
}