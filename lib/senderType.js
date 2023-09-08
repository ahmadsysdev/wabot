const fs = require('fs');
const ms = require('ms');

const { database } = require('../utils/');
global.db = new database();
fs.existsSync('./database/premium.json') || db.add('premium');
fs.existsSync('./database/professional.json') || db.add('professional');

/**
 * Add premium role with an expiration time for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} expired - The expiration time for the premium role.
 * @returns {object} - The updated premium role information.
 */
const addPremium = (userId, expired) => {
    let content;
    let check = db.check('premium', userId, 'id');
    if (check) {
        check.expired = check.expired + ms(expired);
        content = check;
    } else {
        content = { id: userId, expired: Date.now() + ms(expired) };
    }
    return check ? db.replace('premium', content, userId, 'id') : db.modified('premium', content);
};

/**
 * Get the position of a user's premium role.
 * @param {string} userId - The ID of the user.
 * @returns {string|undefined} - The position of the premium role or undefined if not found.
 */
const getPremiumPosition = (userId) => {
    let position;
    if (!fs.existsSync('./database/premium.json')) return;
    const _obj = JSON.parse(fs.readFileSync('./database/premium.json'));
    Object.keys(_obj).forEach((x) => {
        if (_obj[x].id === userId) {
            position = x;
        }
    });
    if (!position) return;
};

/**
 * Get the expiration date of a user's premium role.
 * @param {string} userId - The ID of the user.
 * @returns {number|undefined} - The expiration date or undefined if not found.
 */
const getPremiumExpired = (userId) => {
    const check = db.check('premium', userId, 'id');
    return check ? check.expired : void 0;
};

/**
 * Get the premium role information of a user.
 * @param {string} userId - The ID of the user.
 * @returns {object|undefined} - The premium role information or undefined if not found.
 */
const getPremiumUser = (userId) => {
    return db.check('premium', userId, 'id');
};

/**
 * Check premium role status and send expiration message if expired.
 * @param {string} userId - The ID of the user.
 */
const expiredPremium = (userId) => {
    setInterval(() => {
        const check = db.check('premium', userId, 'id');
        if (check && Date.now() >= check.expired) {
            const name = client.getName(userId);
            db.delete('premium', userId, 'id');
            client.sendMessage(userId, { text: `Hey ${name}! Your premium role has run out (expired). Thank you.` }).then(() => void 0);
        }
    });
};

/**
 * Get an array of all users with the premium role.
 * @returns {string[]} - Array of user IDs with premium role.
 */
const getAllPremium = () => {
    if (!fs.existsSync('./database/premium.json')) return;
    const file = fs.readFileSync('./database/premium.json');
    const prem = [];
    Object.keys(JSON.parse(file)).forEach((i) => {
        prem.push(i.id);
    });
    return prem;
};

/**
 * Add professional role with an expiration time for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} expired - The expiration time for the professional role.
 * @returns {object} - The updated professional role information.
 */
const addProfessional = (userId, expired) => {
    let content;
    let check = db.check('professional', userId, 'id');
    if (check) {
        check.expired = check.expired + ms(expired);
        content = check;
    } else {
        content = { id: userId, expired: Date.now() + ms(expired) };
    }
    return check ? db.replace('professional', content, userId, 'id') : db.modified('professional', content);
};

/**
 * Get the position of a user's professional role.
 * @param {string} userId - The ID of the user.
 * @returns {string|undefined} - The position of the professional role or undefined if not found.
 */
const getProfessionalPosition = (userId) => {
    let position;
    if (!fs.existsSync('./database/professional.json')) return;
    const _obj = JSON.parse(fs.readFileSync('./database/professional.json'));
    Object.keys(_obj).forEach((x) => {
        if (_obj[x].id === userId) {
            position = x;
        }
    });
    if (!position) return;
};

/**
 * Get the expiration date of a user's professional role.
 * @param {string} userId - The ID of the user.
 * @returns {number|undefined} - The expiration date or undefined if not found.
 */
const getProfessionalExpired = (userId) => {
    const check = db.check('professional', userId, 'id');
    return check ? check.expired : void 0;
};

/**
 * Get the professional role information of a user.
 * @param {string} userId - The ID of the user.
 * @returns {object|undefined} - The professional role information or undefined if not found.
 */
const getProfessionalUser = (userId) => {
    return db.check('professional', userId, 'id');
};

/**
 * Check professional role status and send expiration message if expired.
 * @param {string} userId - The ID of the user.
 */
const expiredProfessional = (userId) => {
    setInterval(() => {
        const check = db.check('professional', userId, 'id');
        if (check && Date.now() >= check.expired) {
            const name = client.getName(userId);
            db.delete('professional', userId, 'id');
            client.sendMessage(userId, { text: `Hey ${name}! Your professional role has run out (expired). Thank you.` }).then(() => void 0);
        }
    });
};

/**
 * Get an array of all users with the professional role.
 * @returns {string[]} - Array of user IDs with professional role.
 */
const getAllProfessional = () => {
    const file = fs.readFileSync('./database/professional.json');
    const prof = [];
    Object.keys(JSON.parse(file)).forEach((i) => {
        prof.push(i.id);
    });
    return prof;
};

/**
 * Add client session with an expiration time for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} expired - The expiration time for the session.
 * @returns {object} - The updated session information.
 */
const addClient = (userId, expired) => {
    let content;
    let check = db.check('sessions', userId, 'id');
    if (check) {
        check.expired = check.expired + ms(expired);
        content = check;
    } else {
        content = { id: userId, expired: Date.now() + ms(expired) };
    }
    return check ? db.replace('sessions', content, userId, 'id') : db.modified('sessions', content);
};

// Export all functions to be used in other parts of the code
module.exports = {
    addPremium,
    getPremiumExpired,
    getPremiumPosition,
    expiredPremium,
    getAllPremium,
    getPremiumUser,
    addProfessional,
    getProfessionalUser,
    getProfessionalPosition,
    getProfessionalExpired,
    expiredProfessional,
    getAllProfessional,
    addClient,
};