/**
 * Handles the detection and handling of group link invitations in messages.
 *
 * @param {object} client - The messaging client.
 * @param {object} message - The received message to analyze.
 * @returns {Promise<void>} - A promise that resolves after processing the message.
 */
module.exports = async function handleGroupLinkInvitations(client, message) {
    // Check if 'antilink' option is enabled for the user
    if (!db.check('antilink', message.from, 'id')) return;

    const { body, sender, from } = message;
    // Check if the message has a body
    if (typeof body === 'undefined') return;

    // Define the regular expression to match group links
    const regex = /chat.whatsapp.com\/([\w\d]*)/gi;
    let code = body.match(regex);
    if (!code) return;

    // Extract the invite code from the matched link
    code = code[0].replace('chat.whatsapp.com/', '');

    // Validate the invite code using the client
    const validation = await client.checkInviteCode(code);
    if (!validation) {
        return await client.sendMessage(message.from, { text: 'Invalid group link invitation.' }, { quoted: message });
    }

    // Get the current invite code for the group
    const inviteCode = await client.groupInviteCode(message.from);
    if (code === inviteCode) return;

    // Inform the user about group rules and potential consequences
    const text = `Group Link Detected! To ensure a positive group experience, please read and respect the group rules outlined in the description. Failure to do so could lead to your removal. Thank you for your cooperation.`;
    await client.sendMessage(message.from, { text }, { quoted: message });

    // Prepare a reason for removing the participant
    const reason = ['「 PARTICIPANT REMOVED 」\n'];
    reason.push(`User: @${sender.split('@')[0]}`);
    reason.push('Reason: *Sending other group link invitation*');

    // Remove the participant from the group
    return client.groupParticipantsUpdate(message.from, [sender], 'remove')
        .then((x) => {
            if (x[0] && x[0].status === '200') {
                return client.sendMessage(message.from, { text: reason.join('\n'), withTag: true }, { quoted: message }).then(() => {});
            }
        })
        .catch(() => client.sendMessage(message.from, { text: 'An error occurred.' }).then(() => {}));
};
