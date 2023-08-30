const { findPhoneNumbersInText } = require("libphonenumber-js");
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
     * Indicates if this command is only available for professional.
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
    async run(client, message, { queries, mentioned, isGroup, conf, prefix }) {
        // If not in a group, add the sender as a mentioned user
        if (!isGroup) mentioned.push(message.from);

        const mentions = message.mentions.concat(message.quoted?.mentions, [message.quoted?.sender], mentioned);
        const data = findPhoneNumbersInText(queries + mentions.join(' '), 'MY');
        const number = [];
        data.forEach((x) => {
            number.push(x.number.number);
        });
        number.filter((value, index, self) => {
            return self.indexOf(value) === index;
        })
        
        const key = conf.check('credentials', 'truecaller', 'app');
        if (!key) return await client.sendMessage(message.from, { text: `Please login your account first. Use ${prefix}tc <phone> to login.` }, { quoted: message });
        const response = await truecallerjs.bulkSearch(number.join(','), key.phones[0]?.countryCode, key.installationId);
        if (!response.data) return await client.sendMessage(message.from, { text: response.message }, { quoted: message });
        if (!response.data[0]) return await client.sendMessage(message.from, { text: 'Not found.' }, { quoted: message });
        const text = [];
        for (let x of response.data) {
            const info = [];
            info.push(`❏ Name: ${x.value.name}`)
            info.push(`❏ Number: ${x.key}`)
            info.push(`❏ Carrier: ${x.value?.phones[0].carrier}`)
            info.push(`❏ Type: ${x.value?.phones[0].numberType}`)
            if (x.value.addresses[0]) {
                info.push(`❏ Address: ${x.value.addresses[0].address}`)
                info.push(`❏ Time Zone: ${x.value.addresses[0].timeZone}`);
            }
            if (x.value.internetAddresses[0]) {
                info.push(`❏ Email: ${x.value.internetAddresses[0].id}`);
            }
            if (x.value.image) {
                await client.sendImage(message.from, x.value.image, info.join('\n'), message);
                continue
            }
            await client.sendMessage(message.from, { text: info.join('\n') }, { quoted: message });
        }
    }
};