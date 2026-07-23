const db = require('../../config/dbConfig');

const RESET_TABLES = [
    { table: 'caps_add_findings', key: 'seq_no' },
    { table: 'caps_add_decision', key: 'decision_id' },
    { table: 'caps_add_assessor_pool_cases', key: 'id' },
    { table: 'caps_add_contract_details', key: 'contract_id' },
    { table: 'caps_add_life_assured_details', key: 'seq_no' },
    { table: 'caps_add_details', key: 'case_id' },
    { table: 'caps_add_raw_data', key: 'seq_id' },
];

async function ensureAddDetailsSchema(connection) {
    await connection.query(
        'ALTER TABLE caps_add_details MODIFY initiation_remarks VARCHAR(500) NULL'
    );
}

/**
 * Clears ADD workflow tables for a clean demo (keeps master/reference tables).
 */
const resetAddDemoData = async () => {
    const connection = await db.getConnection();
    const deleted = {};

    try {
        await connection.beginTransaction();
        await ensureAddDetailsSchema(connection);

        for (const { table, key } of RESET_TABLES) {
            const [result] = await connection.query(
                `DELETE FROM ?? WHERE ?? > 0`,
                [table, key]
            );
            deleted[table] = result.affectedRows ?? 0;
        }

        await connection.commit();
        return deleted;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { resetAddDemoData };
