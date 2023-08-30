const fs = require('fs');
const path = require('path');

class database {
    constructor(...args) {
        this.path = 'database';

        /**
         * Add a new JSON file to the database.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {string} [content='[]'] - The initial content for the JSON file.
         * @returns {boolean|undefined} - Returns `true` if the JSON file was added successfully, `undefined` otherwise.
         */
        this.add = function (name, content) {
            // Check if the 'name' parameter is provided
            if (!name) return;

            // Generate the full file path
            const filepath = path.join(this.path, name + '.json');

            // Create the database directory if it doesn't exist
            if (!fs.existsSync(this.path)) fs.mkdirSync(this.path);

            // Check if the file already exists, and return if it does
            if (fs.existsSync(filepath)) return;

            try {
                // Set default content to '[]' if not provided
                content = content ? content : '[]';

                // Write the content to the JSON file
                fs.writeFileSync(filepath, content);

                // Return 'true' to indicate successful addition
                return true;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                console.log(err);
                return;
            }
        }

        /**
         * Modify an existing JSON file in the database by adding new content.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} content - The content to add to the JSON file.
         * @returns {boolean|undefined} - Returns `true` if the modification was successful, `undefined` otherwise.
         */
        this.modified = function (name, content) {
            // Check if the 'name' and 'content' parameters are provided
            if (!name || !content) return;

            // Generate the full file path
            const filepath = path.join(this.path, name + '.json');

            // If the file doesn't exist, add it with default content
            if (!fs.existsSync(filepath)) this.add(name);

            try {
                // Read and parse existing data from the JSON file
                let data = JSON.parse(fs.readFileSync(filepath));

                // Add the new content to the existing data
                data.push(content);

                // Write the updated data back to the JSON file
                fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

                // Return 'true' to indicate successful modification
                return true;
            } catch (err) {
                // Return 'undefined' on failure
                return;
            }
        }

        /**
         * Replace content in an existing JSON file in the database.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} content - The content to replace the existing content with.
         * @param {*} key - The key used for finding the content to be replaced.
         * @param {string} [variable] - The variable used for comparison (if applicable).
         * @returns {boolean|undefined} - Returns `true` if the replacement was successful, `undefined` otherwise.
         */
        this.replace = function (name, content, key, variable) {
            // Check if the 'name', 'content', and 'key' parameters are provided
            if (!name || !content || !key) return;

            // Generate the full file path
            const filepath = path.join(this.path, name + '.json');

            // Return if the file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                let index;
                const read = JSON.parse(fs.readFileSync(filepath));

                // Find the index of the content to be replaced
                const find = read.find((value, num) => {
                    index = num;
                    return (variable ? value[variable] === key : Object.keys(value).find(keys => keys === key))
                });

                // If the content is not found, return
                if (!find) return;

                // Delete the existing content and replace with new content
                delete read[index];
                read[index] = content;

                // Write the updated data back to the JSON file
                fs.writeFileSync(filepath, JSON.stringify(read, null, 2));

                // Return 'true' to indicate successful replacement
                return true;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                console.log(err);
                return;
            }
        }

        /**
         * Delete content from an existing JSON file in the database.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} key - The key used for finding the content to be deleted.
         * @param {string} [variable] - The variable used for comparison (if applicable).
         * @returns {boolean|undefined} - Returns `true` if the deletion was successful, `undefined` otherwise.
         */
        this.delete = function (name, key, variable) {
            // Check if the 'name' and 'key' parameters are provided
            if (!name || !key) return;

            // Generate the full file path
            const filepath = path.join(this.path, name + '.json');

            // Return if the file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                let index;
                const read = JSON.parse(fs.readFileSync(filepath));

                // Filter out content to be deleted based on the key and variable
                const content = read.filter((value) => {
                    return (variable ? value[variable] !== key : Object.keys(value).find(keys => keys !== key));
                });

                // Write the updated data back to the JSON file
                fs.writeFileSync(filepath, JSON.stringify(content, null, 2));

                // Return 'true' to indicate successful deletion
                return true;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                console.log(err);
                return;
            }
        }

        /**
         * Rename an existing JSON file in the database.
         * @param {string} name - The current name of the JSON file (without extension).
         * @param {string} newName - The new name for the JSON file (without extension).
         * @returns {boolean|undefined} - Returns `true` if the renaming was successful, `undefined` otherwise.
         */
        this.rename = function (name, newName) {
            // Check if the 'name' and 'newName' parameters are provided
            if (!name || !newName) return;

            // Generate the full file path of the existing file
            const filepath = path.join(this.path, name + '.json');

            // Generate the full file path of the new file name
            const newFilePath = path.join(this.path, newName + '.json');

            // Return if the existing file doesn't exist
            if (!fs.existsSync(filepath)) return;

            // Return if the new file name already exists
            if (fs.existsSync(newFilePath)) {
                console.log(newFilePath, 'already exists.');
                return;
            }

            try {
                // Rename the existing file to the new file name
                fs.renameSync(filepath, newFilePath);

                // Return 'true' to indicate successful renaming
                return true;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                console.log(err);
                return;
            }
        }

        /**
         * Delete an existing JSON file from the database.
         * @param {string} name - The name of the JSON file (without extension) to be deleted.
         * @returns {boolean|undefined} - Returns `true` if the deletion was successful, `undefined` otherwise.
         */
        this.unlink = function (name) {
            // Generate the full file path of the JSON file
            const filepath = path.join(this.path, name + '.json');

            // Return if the 'name' parameter is not provided
            if (!name) return;

            // Return if the file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Delete the JSON file
                fs.rmSync(filepath);

                // Return 'true' to indicate successful deletion
                return true;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                console.log(err);
                return;
            }
        }

        /**
         * Check if a certain data exists in an existing JSON file in the database.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} data - The data to be checked in the JSON file.
         * @param {string} [variable] - The variable used for comparison (if applicable).
         * @returns {boolean|*} - Returns the found data if it exists, or `false` if not found.
         */
        this.check = function (name, data, variable) {
            // Generate the full file path of the JSON file
            const filepath = path.join(this.path, name + '.json');

            // Return if the 'name' and 'data' parameters are not provided
            if (!name || !data) return;

            // Return if the file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Read the contents of the JSON file
                let read = JSON.parse(fs.readFileSync(filepath));

                // Find and return the data if it exists, or 'false' if not found
                return read.find((value) => (variable ? value[variable] === data : Object.keys(value).find(keys => keys === data))) || false;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                return;
            }
        }

        /**
         * Find duplicate data based on a specific key in an existing JSON file in the database.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} data - The data to be checked for duplicates.
         * @param {string} key - The key used for duplicate comparison.
         * @returns {boolean|Array} - Returns an array of duplicate data found, or `false` if no duplicates.
         */
        this.duplicate = function (name, data, key) {
            // Generate the full file path of the JSON file
            const filepath = path.join(this.path, name + '.json');

            // Return if the 'name', 'data', or 'key' parameters are not provided
            if (!name || !data || !key) return;

            // Return if the file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Read the contents of the JSON file
                const read = JSON.parse(fs.readFileSync(filepath));

                // Filter and find duplicate data based on the specified key
                const result = read.filter((v, i) => {
                    return read.find((value, index) => {
                        // Compare values using the specified key
                        if (index !== i && value[key] === v[key] && value[key] === data) return value;
                    });
                });

                // Return the array of duplicate data if found, or 'false' if no duplicates
                return (result.length === 0 ? false : result);
            } catch (err) {
                // Log the error and return 'undefined' on failure
                return;
            }
        }

        /**
         * Read the contents of an existing JSON file from the database.
         * @param {string} name - The name of the JSON file (without extension).
         * @returns {*} - Returns the parsed contents of the JSON file if it exists, or `undefined` on failure.
         */
        this.read = function (name) {
            // Generate the full file path of the JSON file
            const filepath = path.join(this.path, name + '.json');

            // Return if the file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Read and parse the contents of the JSON file
                return JSON.parse(fs.readFileSync(filepath));
            } catch (err) {
                // Log the error and return 'undefined' on failure
                return;
            }
        }

    }
}

// Exports
module.exports = database;