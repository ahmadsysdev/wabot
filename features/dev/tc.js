const { findPhoneNumbersInText } = require("libphonenumber-js");
const truecallerjs = require("truecallerjs");

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'tclogin',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['tc', 'tclog'],

    /**
     * Command category.
     * @type {string}
     */
    category: 'developer',

    /**
     * Indicates if this command requires a query.
     * @type {boolean}
     */
    query: true,

    /**
     * Indicates if this command is only available for developers.
     * @type {boolean}
     */
    isDev: true,

    /**
     * Regular expression to validate the phone number.
     * @type {RegExp}
     */
    regex: /\d+/,

    /**
     * Message display when there's no phone number provided.
     * @type {string}
     */
    message: { regex: 'Please give your phone number to initiate the login process.', query: `Please give your phone number to initiate the login process.` },

    /**
     * Command usage.
     * @type {string}
     */
    usage: '< number >',

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.queries - Extracted queries from the message.
     * @param {Object} options.mentioned - Mentioned participant.
     * @param {boolean} options.isGroup - Indicates if the command was triggered in a group.
     */
    async run(client, message, { queries, mentioned, isGroup, cookies, prefix, cmd, conf }) {
        // If not in a group, add the sender as a mentioned user
        if (!isGroup) mentioned.push(message.from);

        // Extract OTP from the queries
        const otp = queries.match(/\b\d{6}\b$/);
        if (!otp) {
            // Find phone numbers in the provided text
            const data = findPhoneNumbersInText(queries, 'MY');
            if (!data[0]) return await client.sendMessage(message.from, { text: `Invalid phone number. Please ensure you've entered a correct number.` }, { quoted: message });

            // Prepare login data and request OTP
            const { country, nationalNumber, number } = data[0]['number'];
            const login_data = await truecallerjs.login(number);
            console.log(login_data)
            var stanza = await client.sendMessage(message.from, { text: 'Please enter OTP number:' }, { quoted: message });
            cookies.get(message.from).set('login_data', { number, nationalNumber, country, login_data });
            return cookies.get(message.from).set(stanza.key.id, { cmd, prefix, noType: true });
        }

        // Verify OTP
        const { country, nationalNumber, number, login_data } = cookies.get(message.from).get('login_data');
        console.log(JSON.stringify(login_data, null, 2))
        console.log(otp)
        const response = await truecallerjs.verifyOtp(number, login_data, otp[0]);

        // Handle OTP verification responses
        if (response.status === 2 && !response.suspended) {
            conf.modified('credentials', { app: 'truecaller', installationId: response.installationId, phones: response.phones });
            const text = [`Login Successfull!`];
            text.push(`User ID: ${response.userId}`);
            text.push(`Country: ${country}`);
            text.push(`National Number: ${nationalNumber}`);
            return await client.sendMessage(message.from, { text: text.join('\n') }, { quoted: message });
        } else if (response.status === 11) {
            return await client.sendMessage(message.from, { text: 'Invalid OTP code.' }, { quoted: message });
        } else if (response.status === 7) {
            return await client.sendMessage(message.from, { text: 'Retries limit exceeded.' }, { quoted: message });
        } else if (response.suspended) {
            return await client.sendMessage(message.from, { text: 'Account suspended. Please use another number.' }, { quoted: message });
        } else {
            return await client.sendMessage(message.from, { text: `Unknown response: ${response.message}` }, { quoted: message });
        }
    }
};