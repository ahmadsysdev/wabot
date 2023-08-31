const { findPhoneNumbersInText, parsePhoneNumber } = require("libphonenumber-js");
const truecallerjs = require("truecallerjs");

module.exports = {
    /**
     * Command name.
     * @type {string}
     */
    name: 'tracenum',

    /**
     * Command aliases.
     * @type {string[]}
     */
    alias: ['who', 'trace'],

    /**
     * Command category.
     * @type {string}
     */
    category: 'professional',

    /**
     * Indicates if this command is only available for professionals.
     * @type {boolean}
     */
    // isProfessional: true,

    /**
     * Command usage.
     * @type {string}
     */
    usage: '< reply/mention/number >',

    /**
     * Main function to run the command.
     * @param {Object} client - The WhatsApp client instance.
     * @param {Object} message - The message that triggered the command.
     * @param {Object} options.queries - Extracted queries from the message.
     * @param {Object} options.mentioned - Mentioned participant.
     * @param {boolean} options.isGroup - Indicates if the command was triggered in a group.
     */
    async run(client, message, { queries, mentioned, isGroup, conf, prefix, reply }) {
        // Extract mentions and phone numbers from the message
        const mentions = message.mentions.concat(message.quoted?.mentions, [message.quoted?.sender], mentioned);
        const data = findPhoneNumbersInText(queries + mentions.join(' '), 'MY');
        let number = [];
        data.forEach((x) => {
            number.push(x.number.number);
        });
        // Remove duplicate phone numbers
        number = number.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });

        // Get the Truecaller API key
        const key = conf.check('credentials', 'truecaller', 'app');
        if (!key) {
            return await client.sendMessage(message.from, { text: `Please log in to your account first. Use ${prefix}tc <phone> to log in.` }, { quoted: message });
        }

        // Search for information about each phone number
        for (let x of number) {
            const phone = parsePhoneNumber(x);
            const searchData = {
                number: phone.nationalNumber,
                countryCode: phone.country,
                installationId: key.installationId
            };
            const search = await truecallerjs.search(searchData);
            const result = search.data;
            // console.log(JSON.stringify(search, null, 2));
            if (!result?.data) {
                return await client.sendMessage(message.from, { text: result?.message || reply.error }, { quoted: message });
            }
            if (!result?.data[0]) {
                return await client.sendMessage(message.from, { text: 'Not found.' }, { quoted: message });
            }

            // Process the retrieved data
            for (let x of result.data) {
                const info = [];
                info.push(`❏ Name: *${x.name || 'Not found'}*`);
                info.push(`❏ Number: *${phone.number}*`);
                info.push(`❏ Carrier: *${x.phones?.[0].carrier}*`);
                info.push(`❏ Type: *${x.phones?.[0].numberType}*`);
                if (x.addresses[0]) {
                    info.push(`❏ Address: *${x.addresses[0].address}*`);
                    info.push(`❏ Time Zone: *${x.addresses[0].timeZone}*`);
                }
                if (x.internetAddresses[0]) {
                    !x.internetAddresses[0].id || info.push(`❏ Email: *${x.internetAddresses[0].id}*`);
                }
                if (x.image) {
                    await client.sendImage(message.from, x.image, info.join('\n'), message);
                    continue;
                }
                await client.sendMessage(message.from, { text: info.join('\n') }, { quoted: message });
            }
        }
    }
};
