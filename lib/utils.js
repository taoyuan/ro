var fs = require('fs');

exports.parseSSLOptions = function (options) {
    parseOptionForFile(options, 'pfx');
    parseOptionForFile(options, 'key');
    parseOptionForFile(options, 'cert');
    parseOptionForFile(options, 'ca');
    return options;
};

function parseOptionForFile(options, key) {
    if (options[key]) return;
    if (options[key + 'File']) {
        options[key] = fs.readFileSync(options[key + 'File']);
    }
}
