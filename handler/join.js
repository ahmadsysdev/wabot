/**
 * Automatically accepts and joins a group using an invite link if enabled.
 *
 * @param {object} client - The messaging client.
 * @param {object} message - The received message to analyze.
 * @param {string} subject - The subject of the message (usually the group ID).
 */
module.exports = async function autoJoinGroup(client, message, subject) {
    // Check if 'autojoin' option is enabled
    if (!db.read('autojoin')) return;

    const body = message.body;
    // Extract group invite link from the message body
    const regex = body.match(/chat.whatsapp.com\/([\w\d]*)/gi);
    if (!body || !regex) return;

    const code = regex[0].replace('chat.whatsapp.com/', '');

    // Check if the invite code is valid
    let check = await client.checkInviteCode(code);
    if (!check) return;

    // Accept and join the group using the invite code
    client.groupAcceptInvite(code)
        .then((x) => logger.info(`Triggering auto-join for group ${x} from ${message.from} with the subject: ${subject}.`))
        .catch((e) => logger.error(`Error encountered while auto-joining: ${code} from ${subject} (${message.sender})`));
}
