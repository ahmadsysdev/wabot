const fetch = require('node-fetch');
const formdata = require('form-data');
const { JSDOM } = require('jsdom');

/**
 * Converts a WebP image to MP4 video using ezgif.com service.
 * @param {string} media - URL or local path of the WebP image.
 * @returns {Promise<string>} - URL of the converted MP4 video.
 */
async function webp2mp4(media) {
    let form = new formdata();
    const isurl = typeof media === 'string' && /https?:\/\//.test(media);
    form.append('new-image-url', isurl ? media : '');
    form.append('new-image', isurl ? '' : media, 'image.webp');
    const response = await fetch('https://ezgif.com/webp-to-mp4', {
        method: 'POST',
        body: form,
    });

    let html = await response.text();
    let { document } = new JSDOM(html).window;
    let _form = new formdata();
    let obj = {};
    for (let input of document.querySelectorAll('form input[name]')) {
        obj[input.name] = input.value;
        _form.append(input.name, input.value);
    }
    const _response = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, {
        method: 'POST',
        body: _form,
    });
    let _html = await _response.text();
    let { document: _document } = new JSDOM(_html).window;
    return new URL(_document.querySelector('div#output > p.outfile > video > source').src, _response.url).toString();
}

/**
 * Converts a WebP image to PNG image using ezgif.com service.
 * @param {string} media - URL or local path of the WebP image.
 * @returns {Promise<string>} - URL of the converted PNG image.
 */
async function webp2png(media) {
    let form = new formdata();
    const isurl = typeof media == 'string' && /https?:\/\//.test(media);
    form.append('new-image-url', isurl ? media : '');
    form.append('new-image', isurl ? '' : media, 'image.webp');
    const response = await fetch('https://ezgif.com/webp-to-png', {
        method: 'POST',
        body: form,
    });
    const html = await response.text();
    const { document } = new JSDOM(html).window;
    const _form = new formdata();
    const obj = {};
    for (let input of document.querySelectorAll('form input[name]')) {
        obj[input.name] = input.value;
        _form.append(input.name, input.value);
    }
    const _response = await fetch('https://ezgif.com/webp-to-png/' + obj.file, {
        method: 'POST',
        body: _form,
    });
    const _html = await _response.text();
    let { document: _document } = new JSDOM(_html).window;
    return new URL(_document.querySelector('div#output > p.outfile > img').src, _response.url).toString();
}

// Export the functions to be used in other parts of the code
module.exports = {
    webp2mp4,
    webp2png,
};
