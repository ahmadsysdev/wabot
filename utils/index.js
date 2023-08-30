// Import functions and modules
const {
    writeFile,
    download,
    deleteDirectory
} = require('./files');

// Function to remove duplicate objects from an array
const objDupl = (obj) => {
    return obj.filter((value, index, self) =>
        index === self.findIndex((el) => (
            JSON.stringify(el) === JSON.stringify(value)
        ))
    );
};

// Function to remove duplicate elements from an array
const arrDupl = (array) => {
    return array.filter((value, index) =>
        array.indexOf(value) === index
    );
};

// Export functions and modules
module.exports = {
    // Import and export 'parseOptions' function from 'parseOptions.js'
    parseOptions: require('./parseOptions'),

    // Export the objDupl and arrDupl functions defined above
    objDupl,
    arrDupl,

    // Import and export the 'database' module from 'database.js'
    database: require('./database'),

    // Export the writeFile, deleteDirectory and download functions from above
    writeFile,
    download,
    deleteDirectory,

    // Import and export the 'config' module from 'config.js'
    config: require("./config"),
};
