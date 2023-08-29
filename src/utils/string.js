// Convert string to standard form
const toStandard = (str) => str.replace(/  +/g, " ").toLowerCase().trim();

// Compare string in standard form
const compStandard = (str1, str2) => toStandard(str1) === toStandard(str2);

// Export utils
exports.toStandard = toStandard;
exports.compStandard = compStandard;
