/**
 * Return the first truthy argument.
 * @param {...*} arguments - The arguments to check.
 * @returns {*} - The first truthy argument, or the last argument if all are falsy.
 */
function or() {
    for (let arg of arguments) {
        if (arg) return arg;
    }
    return arguments[arguments.length - 1];
}

/**
 * Parse options by combining default options with provided arguments.
 * @param {Object} optionArgs - The default options.
 * @param {Object} args - The provided arguments.
 * @returns {Object} - The combined options object.
 */
module.exports = function parseOptions(optionArgs = {}, args = {}) {
    let options = {};
    let entries = Object.entries(optionArgs);
    for (let i = 0; i < entries.length; i++) {
        let [key, value] = entries[i];
        options[key] = or(args[key], value);
    }
    return options;
}