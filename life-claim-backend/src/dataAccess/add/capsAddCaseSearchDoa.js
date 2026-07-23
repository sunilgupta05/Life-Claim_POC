const CapsAddDetails = require('../../models/add/CapsAddDetails');

/** Whitelist — must match UI attribute dropdowns (Case Search + Case Assignment). */
const SEARCHABLE_ATTRIBUTES = new Set([
    'policy_number',
    'krn',
    'case_status',
    'iris_status',
    'assigned_to',
]);

const caseSearchData = async (attribute, value, limit, offset) => {
    try {
        if (!attribute || !SEARCHABLE_ATTRIBUTES.has(attribute)) {
            const err = new Error(`Invalid search attribute: ${attribute || '(empty)'}`);
            err.statusCode = 400;
            throw err;
        }
        if (value == null || String(value).trim() === '') {
            const err = new Error('Search value is required');
            err.statusCode = 400;
            throw err;
        }

        let searchValue = String(value).trim();
        // Normalize policy number if that's the search attribute
        if (attribute === 'policy_number') {
            if (searchValue.length < 8 && /^\d+$/.test(searchValue)) {
                searchValue = searchValue.padStart(8, '0');
            }
        }

        const { rows, count } = await CapsAddDetails.findAndCountAll({
            where: {
                [attribute]: searchValue,
            },
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            order: [['case_id', 'DESC']]
        });
        console.log(`caseSearchData.js >> found ${rows.length} cases out of ${count}`);
        return { rows, count };
    } catch (error) {
        console.error('DataAccess > capsAddCaseSearchDoa.js > caseSearchData, Error getting data from CapsAddDetails:', error);
        throw error;
    }
}

module.exports = {caseSearchData};