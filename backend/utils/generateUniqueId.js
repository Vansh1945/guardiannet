const generateUniqueId = async (Model) => {
    let uniqueId;
    let isUnique = false;

    while (!isUnique) {
        uniqueId = Math.floor(1000 + Math.random() * 9000).toString(); // Generate 4-digit number
        const existingRecord = await Model.findOne({ permanentId: uniqueId });
        if (!existingRecord) isUnique = true; // Ensure ID is unique
    }

    return uniqueId;
};

module.exports = generateUniqueId;