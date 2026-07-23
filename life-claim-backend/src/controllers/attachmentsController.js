const con = require('../config/dbConfig');

const exposeErrorDetails = process.env.NODE_ENV !== 'production';

exports.getAllAttachments = async (req, res) => {
    const query = 'SELECT * FROM attachment WHERE inward_id = ?';

    try {
        const [result, fields] = await con.query(query, [req.params.mailId]);
        if (result.length > 0) {
            res.status(200).send(result);
        } else {
            res.status(404).send({ msg: 'No attachments found!' });
        }
    } catch (err) {
        console.error("Error during query execution:", err);
        res.status(500).json({
            message: 'Internal server error',
            ...(exposeErrorDetails ? { detail: err.message } : {}),
        });
    }
};


exports.patchAttachments = async (req, res) => {

    try {
        for (const file_id of Object.keys(req.body || {})) {
            const query = `UPDATE attachment SET document_type = ? WHERE inward_id = ?`;
            await con.query(query, [req.body[file_id], file_id]);
            console.log('attachmentsController >> patchAttachments row updated');
        }
        res.status(200).send({ msg: 'Data updated successfully!' });
    } catch (err) {
        console.error("Error during updating attachments:", err);
        res.status(500).json({
            message: 'Internal server error',
            ...(exposeErrorDetails ? { detail: err.message } : {}),
        });
    }
};
