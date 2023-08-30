const fs = require('fs');
const path = require('path');

class config {
    constructor(...args) {
        this.path = 'config';

        /**
         * Add a new JSON file to the 'config' directory with the provided name and content.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} [content] - The content to be written to the JSON file (default: '[]').
         * @returns {boolean|undefined} - Returns 'true' if the file was added successfully, or 'undefined' on failure.
         */
        this.add = function (name, content) {
            // Return if the 'name' parameter is not provided
            if (!name) return;

            // Generate the full file path of the JSON file within the 'config' directory
            const filepath = path.join(this.path, name + '.json');

            // Return if the file already exists
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
         * Add a new JSON file to the 'config' directory with the provided name and content.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} [content] - The content to be written to the JSON file (default: '[]').
         * @returns {boolean|undefined} - Returns 'true' if the file was added successfully, or 'undefined' on failure.
         */
        this.add = function (name, content) {
            // Return if the 'name' parameter is not provided
            if (!name) return;

            // Generate the full file path of the JSON file within the 'config' directory
            const filepath = path.join(this.path, name + '.json');

            // Return if the file already exists
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
         * Replace an existing entry in a JSON file with new content based on a specified key.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {*} content - The new content to replace the existing entry.
         * @param {string} key - The key used to identify the entry to be replaced.
         * @param {string} variable - Optional. The variable to compare against the key (if needed).
         * @returns {boolean|undefined} - Returns 'true' if the replacement was successful, or 'undefined' on failure.
         */
        this.replace = function (name, content, key, variable) {
            // Return if 'name', 'content', or 'key' parameters are not provided
            if (!name || !content || !key) return;

            // Generate the full file path of the JSON file
            const filepath = path.join(this.path, name + '.json');

            // Return if the JSON file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                let index;
                // Read the existing content of the JSON file
                const read = JSON.parse(fs.readFileSync(filepath));

                // Find the entry to be replaced based on the specified key and variable (if provided)
                const find = read.find((value, num) => {
                    index = num;
                    return (variable ? value[variable] === key : Object.keys(value).find(keys => keys === key));
                });

                // If the entry is not found, return
                if (!find) return;

                // Delete the existing entry and replace it with the new content
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
         * Delete entries from a JSON file based on a specified key and variable.
         * @param {string} name - The name of the JSON file (without extension).
         * @param {string} key - The key used to identify the entries to be deleted.
         * @param {string} variable - Optional. The variable to compare against the key (if needed).
         * @returns {boolean|undefined} - Returns 'true' if the deletion was successful, or 'undefined' on failure.
         */
        this.delete = function (name, key, variable) {
            // Return if 'name' or 'key' parameters are not provided
            if (!name || !key) return;

            // Generate the full file path of the JSON file
            const filepath = path.join(this.path, name + '.json');

            // Return if the JSON file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                let index;
                // Read the existing content of the JSON file
                const read = JSON.parse(fs.readFileSync(filepath));

                // Filter out entries that match the specified key and variable (if provided)
                const content = read.filter((value) => {
                    return (variable ? value[variable] !== key : Object.keys(value).find(keys => keys !== key));
                });

                // Write the filtered content back to the JSON file
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
         * Rename a JSON file by changing its name in the file system.
         * @param {string} name - The current name of the JSON file (without extension).
         * @param {string} newName - The new name to assign to the JSON file (without extension).
         * @returns {boolean|undefined} - Returns 'true' if renaming was successful, 'undefined' on failure.
         */
        this.rename = function (name, newName) {
            // Return if 'name' or 'newName' parameters are not provided
            if (!name || !newName) return;

            // Generate the full file path of the current JSON file
            const filepath = path.join(this.path, name + '.json');

            // Generate the full file path of the new JSON file with the desired name
            const newFilePath = path.join(this.path, newName + '.json');

            // Return if the current JSON file doesn't exist
            if (!fs.existsSync(filepath)) return;

            // Check if the new JSON file name conflicts with existing files
            if (fs.existsSync(newFilePath)) {
                console.log(newFilePath, 'already exists.');
                return;
            }

            try {
                // Rename the current JSON file to the new name
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
         * Remove (unlink) a JSON file from the file system.
         * @param {string} name - The name of the JSON file to be removed (without extension).
         * @returns {boolean|undefined} - Returns 'true' if removal was successful, 'undefined' on failure.
         */
        this.unlink = function (name) {
            // Generate the full file path of the JSON file to be removed
            const filepath = path.join(this.path, name + '.json');

            // Return if 'name' parameter is not provided
            if (!name) return;

            // Return if the JSON file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Remove (unlink) the JSON file from the file system
                fs.rmSync(filepath);

                // Return 'true' to indicate successful removal
                return true;
            } catch (err) {
                // Log the error and return 'undefined' on failure
                console.log(err);
                return;
            }
        }

        /**
         * Check if a certain data value exists in a JSON file.
         * @param {string} name - The name of the JSON file to be checked (without extension).
         * @param {string|object} data - The data value to be checked.
         * @param {string|undefined} variable - Optional variable key for checking if 'data' is a value within that variable.
         * @returns {object|boolean|undefined} - Returns the object with the matching data, 'true' if found, or 'false' if not found, 'undefined' on error.
         */
        this.check = function (name, data, variable) {
            // Generate the full file path of the JSON file to be checked
            const filepath = path.join(this.path, name + '.json');

            // Return if 'name' or 'data' parameters are not provided
            if (!name || !data) return;

            // Return if the JSON file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Read the content of the JSON file and parse it
                let read = JSON.parse(fs.readFileSync(filepath));

                // Find and return the object with the matching data value (if 'variable' is provided)
                // Otherwise, check if 'data' value matches any of the keys within the objects
                return read.find((value) => (variable ? value[variable] === data : Object.keys(value).find(keys => keys === data)));
            } catch (err) {
                // Return 'undefined' on error
                return;
            }
        }

        /**
         * Find duplicate objects based on a specific key and data value in a JSON file.
         * @param {string} name - The name of the JSON file to be checked (without extension).
         * @param {string|number} data - The data value to be checked for duplicates.
         * @param {string} key - The key within the objects to check for duplicates.
         * @returns {array|boolean|undefined} - Returns an array of duplicate objects, 'false' if no duplicates, or 'undefined' on error.
         */
        this.duplicate = function (name, data, key) {
            // Generate the full file path of the JSON file to be checked
            const filepath = path.join(this.path, name + '.json');

            // Return if 'name', 'data', or 'key' parameters are not provided
            if (!name || !data || !key) return;

            // Return if the JSON file doesn't exist
            if (!fs.existsSync(filepath)) return;

            try {
                // Read the content of the JSON file and parse it
                const read = JSON.parse(fs.readFileSync(filepath));

                // Filter out duplicates by comparing each object's 'key' and 'data' values
                const result = read.filter((v, i) => {
                    return read.find((value, index) => {
                        if (index !== i && value[key] === v[key] && value[key] === data) return value;
                    })
                })

                // Return 'false' if no duplicates found, otherwise return the array of duplicates
                return (result.length === 0 ? false : result);
            } catch (err) {
                // Return 'undefined' on error
                return;
            }
        }
    }
}

module.exports = config;