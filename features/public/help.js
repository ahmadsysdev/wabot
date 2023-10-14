const fs = require('fs');
const { getPremiumExpired, getProfessionalExpired } = require('../../lib/senderType');

module.exports = {
    name: 'help',
    alias: ['menu', 'h'],
    desc: 'Providing you with a detailed command guide for exploration.',
    use: '[ command ]',
    category: 'public',
    /**
     * Handles the help command by displaying command information to the user.
	 * @param {object} client - The client instance that handles the bot's interactions with WhatsApp.
	 * @param {object} message - The message object containing information about the received message.
	 * @param {object} options - Additional options passed to the command.
	 * @param {string} options.query - The query provided to the command (if any).
	 * @param {object} options.attribute - An object containing additional attributes related to the command.
	 * @param {string[]} options.args - An array of arguments passed to the command.
	 * @param {string} options.prefix - The command prefix used in the message.
	 * @param {string[]} options.dev - An array of developer-related information.
	 * @param {string} options.arg - The command argument provided (if any).
	 */
    async run(client, message, { query, attribute, args, prefix, dev, arg, reply }) {
        // Check if a specific command is queried
        if (query) {
            // Initialize an array to hold command information
            const data = [];
            const name = query.toLowerCase();
            const { command } = attribute;

            // Find the command based on its name or alias
            const cmd = command.get(name) || [...command.values()].find((x) => x.alias.find((x) => x === args[0]));
            if (!cmd || (cmd.category === 'hidden' && dev[0].jid !== message.sender))
                return message.reply(reply.cmd.replace('@cmdname', name));
            else data.push(`Name: *${cmd.name}*`);
            if (cmd.alias.length !== 0) data.push(`Alias: *${cmd.alias.join(", ")}*`);
            if (cmd.desc) data.push(`Description: *${cmd.desc}*`);
            if (cmd.use) data.push(`Usage: *${prefix}${name} ${cmd.use}*\n\nNote: [] = optional, | = or, <> = must be filled`);
            return await message.reply(data.join('\n'));
        }
        // Display a list of available commands
        else {
            const sections = [];
            const { sender, pushName } = message;
            const { command } = attribute;
            const cmds = command.keys();
            let categories = [];
            const px = require('parse-ms')(getPremiumExpired(message.sender) - Date.now());
            const fx = require('parse-ms')(getProfessionalExpired(message.sender) - Date.now())

            let dashboard = JSON.parse(fs.readFileSync('./database/dashboard.json')).sort(function (a, b) {
                return b.success - a.success;
            });

            // Loop through available commands and categorize them
            for (let cmd of cmds) {
                let info = command.get(cmd);
                if (!cmd) continue;
                let cteg = info.category || 'No Category';
                if (info.type === 'changelog') continue;
                if (cteg === 'hidden') continue;
                if (!cteg || cteg === 'private') cteg = 'Developer command';
                if (Object.keys(categories).find((x) => x === cteg)) categories[cteg].push(info);
                else {
                    categories[cteg] = [];
                    categories[cteg].push(info);
                };
            };

            // Initialize an array to hold command list text
            let text = [];
            text.push(`◪ *INFO USER*`);
            text.push(`❏ Number: 「 ${message.sender.split('@')[0]} 」`);
            text.push(`❏ Name: 「 ${pushName} 」`);
            text.push(`❏ Badges: 「 ${isProfessional ? 'PRO' : isPremium ? 'PREMIUM' : isDev ? 'Developer' : 'Standard'} 」`);
            if (isProfessional) text.push(`❏ Expired: 「 ${fx.days} Days, ${fx.hours} Hour ${fx.minutes} Minutes 」`);
            if (isPremium) text.push(`❏ Expired: 「 ${px.days} Days, ${px.hours} Hour ${px.minutes} Minutes 」`);
            text.push('\n◪ *Most popular feature right now*');
            if (dashboard[0]) text.push(`1. *${dashboard[0].name}* has been used for ${dashboard[0].success + dashboard[0].failed} times.`);
            if (dashboard[1]) text.push(`2. *${dashboard[1].name}* has been used for ${dashboard[1].success + dashboard[1].failed} times.`);
            if (dashboard[2]) text.push(`3. *${dashboard[2].name}* has been used for ${dashboard[2].success + dashboard[2].failed} times.`);

            // Loop through categorized commands and build the command list
            const keys = Object.keys(categories);
            for (const key of keys) {
                if (key === 'developer') continue;
                text.push(`\n◪ *${key.toUpperCase()}*`);
                categories[key].map((cmd, index) => {
                    text.push(`${index + 1}. *${cmd.options.noPrefix ? '' : prefix}${cmd.name}* ${cmd.category === 'private' ? '' : cmd.use ? cmd.use.replace(/>|\]/g, ' 」').replace(/<|\[/g, ' 「') : ''} ${cmd.options.isProfessional ? '(PRO)' : cmd.options.isPremium ? '(PREMIUM)' : ''}`);
                    // rows.push({ title: cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1), rowId: `${cmd.options.noPrefix ? '' : prefix}${cmd.name}`, description: cmd.desc || '' });
                });
            };

            text.push(`\n` + reply.guide.replace('@arg', arg));
            text.push(`\n` + reply.message);

            // Send the message to the user
            return await client.sendMessage(message.from, { text: text.join('\n') }, { quoted: message });
        }
    }
}