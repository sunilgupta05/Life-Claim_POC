const con = require('../config/dbConfig');

exports.getAllMails = async (req, res) => {
    let query = 'SELECT * FROM inbox ORDER BY inward_id';
    const params = [];
    if (req.query.desc === 'true') {
        query += ' DESC';
    }
    const pageRaw = req.query.page;
    if (pageRaw !== undefined && pageRaw !== '') {
        const pageNum = parseInt(String(pageRaw), 10);
        if (!Number.isNaN(pageNum) && pageNum >= 1) {
            const offset = (pageNum - 1) * 10;
            query += ' LIMIT ? OFFSET ?';
            params.push(10, offset);
        } else {
            query += ' LIMIT ?';
            params.push(10);
        }
    } else {
        query += ' LIMIT ?';
        params.push(10);
    }
    try {
        const [result, fields] = await con.query(query, params);
        if (result.length > 0) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ msg: 'No record found!' });
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMailsCount = async (req, res) => {
    let query = `SELECT COUNT(*) AS \`no_of_mails\` FROM \`inbox\``;
    try {
        const [result, fields] = await con.query(query);
        res.status(200).send(result[0]);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.getMailById = async (req, res) => {
    let query = 'SELECT * FROM inbox WHERE inward_id = ?';
    try {
        const [results, fields] = await con.query(query, [req.params.id]);
        if (results.length == 0) {
            res.status(404).send({ msg: 'Mail not found!' });
        } else {
            res.status(200).send(results[0]);
        }
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

