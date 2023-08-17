/**
 * Forwards and relays a message with optional options using the client.
 *
 * @param {object} client - The messaging client.
 * @param {object} message - The original message to forward and relay.
 * @param {object} [options={}] - Additional options for message forwarding.
 * @returns {Promise<void>} - A promise that resolves when the message is forwarded and relayed.
 */
module.exports = async function forwardAndRelay(client, message, options = {}) {
    // Check if the user has the 'antiview' option enabled
    if (!db.check('antiview', message.from, 'id')) return;

    // Set context info for forwarded message
    options.userjid = client.decodeJid(client.user.id);
    message.message[message.type].contextInfo = {
        isForwarded: true,
        forwardingscore: 1,
        mentionedJid: message.mentions,
    };

    // Generate a new message content using baileys
    const content = await baileys.generateWAMessageFromContent(message.from, message.message, options);
    content.key.id = require('crypto').randomBytes(12).toString('hex').toUpperCase();

    // Relay the generated message to the specified user
    return await client.relayMessage(message.from, content.message, {
        messageId: content.key.id,
        userJid: options.userJid,
    });
};
