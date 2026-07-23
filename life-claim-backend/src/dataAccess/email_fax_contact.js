const pool = require('../config/dbConfig');



const addEmail = async (event) => {
  console.info('inside addEmail DAO ', event);
  if (event.hospitalId === undefined || event.email === undefined) {
    console.error('hospitalId or email is undefined');
    throw new Error('Hospital ID or email is undefined');
  }
  const [result] = await pool.execute(
    'INSERT INTO caps_hospital_email (hospital_id, hospital_email) VALUES (?, ?)',
    [
      event.hospitalId, 
      event.email
    ]
   
  );
  
  return {"success":"Data Inserted Successfully"};
};

  

  const addFax = async (event) => {
    console.info('inside addFax DAO ', event);
    if (event.hospitalId === undefined || event.fax === undefined) {
      console.error('hospitalId or fax is undefined');
      throw new Error('Hospital ID or fax is undefined');
    }
    const [result] = await pool.execute(
      'INSERT INTO caps_hospital_fax_no (hospital_id,fax_no) VALUES (?, ?)',
      [
        event.hospitalId,
        event.fax,
       
      ]
    );
    return {"success":"Data Inserted Successfully"};
  };

  
  const addContact = async (event) => {
    console.info('inside addContact DAO ', event);
    if (event.hospitalId === undefined || event.contact === undefined) {
      console.error('hospitalId or contact is undefined');
      throw new Error('Hospital ID or contact is undefined');
    }
    const [result] = await pool.execute(

      'INSERT INTO caps_hospital_contactno (hospital_phone,hospital_id) VALUES (?, ?)',
      [
        event.contact,
        event.hospitalId
       
      ]
    );
    return {"success":"Data Inserted Successfully"};
  };

  const updateEmail = async (hospitalId, updatedDetails, res) => {
    const { HOSPITAL_EMAIL } = updatedDetails;
  
    // Construct SET clause dynamically based on provided updates
    let setClause = '';
    const updateParams = [];
    if (HOSPITAL_EMAIL !== undefined) {
      setClause += 'HOSPITAL_EMAIL = ?, ';
      updateParams.push(HOSPITAL_EMAIL);
    }
  
    // Remove trailing comma and space from SET clause
    setClause = setClause.replace(/,\s*$/, '');
  
    if (setClause === '') {
      console.log('No updates provided');
      return res.status(400).json({ error: 'No updates provided' });
    }
    const query = `UPDATE caps_hospital_email SET ${setClause} WHERE HOSPITAL_ID = ?`;
  
    // Add hospitalId to updateParams array
    updateParams.push(hospitalId);
  
    pool.query(query, updateParams, (err, result) => {
      if (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Event updated successfully');
        res.status(200).json({ message: 'Event updated successfully' });
      }
    });
  };

  const updateFax = async (hospitalId, updatedDetails, res) => {
    const { FAX_NO } = updatedDetails;
  
    // Construct SET clause dynamically based on provided updates
    let setClause = '';
    const updateParams = [];
    if (FAX_NO !== undefined) {
      setClause += 'FAX_NO = ?, ';
      updateParams.push(FAX_NO);
    }
  
    // Remove trailing comma and space from SET clause
    setClause = setClause.replace(/,\s*$/, '');

    if (setClause === '') {
      console.log('No updates provided');
      return res.status(400).json({ error: 'No updates provided' });
    }
  
    const query = `UPDATE caps_hospital_fax_no SET ${setClause} WHERE HOSPITAL_ID = ?`;
  
    // Add hospitalId to updateParams array
    updateParams.push(hospitalId);
  
    pool.query(query, updateParams, (err, result) => {
      if (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Event updated successfully');
        res.status(200).json({ message: 'Event updated successfully' });
      }
    });
  };

  const updateContact = async (hospitalId, updatedDetails, res) => {
    const { HOSPITAL_PHONE } = updatedDetails;
  
    // Construct SET clause dynamically based on provided updates
    let setClause = '';
    const updateParams = [];
    if (HOSPITAL_PHONE !== undefined) {
      setClause += 'HOSPITAL_PHONE = ?, ';
      updateParams.push(HOSPITAL_PHONE);
    }
  
    // Remove trailing comma and space from SET clause
    setClause = setClause.replace(/,\s*$/, '');

    if (setClause === '') {
      console.log('No updates provided');
      return res.status(400).json({ error: 'No updates provided' });
    }
  
    const query = `UPDATE caps_hospital_contactno SET ${setClause} WHERE HOSPITAL_ID = ?`;
  
    // Add hospitalId to updateParams array
    updateParams.push(hospitalId);
  
    pool.query(query, updateParams, (err, result) => {
      if (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Event updated successfully');
        res.status(200).json({ message: 'Event updated successfully' });
      }
    });
  };

  

  
  const deleteEmail = async (hospital_email) => {
    console.info('inside delete DAO ', hospital_email);
    const [result] = await pool.execute('DELETE FROM caps_hospital_email WHERE hospital_email = ?', [hospital_email]);
    return result;
  };
  
  const deleteFax = async (fax_no) => {
    const [result] = await pool.execute('DELETE FROM caps_hospital_fax_no WHERE fax_no = ?', [fax_no]);
    return result;
  };

  const deleteContact = async (hospital_phone) => {
    const [result] = await pool.execute('DELETE FROM caps_hospital_contactno WHERE hospital_phone = ?', [hospital_phone]);
    return result;
  };
  

  module.exports = {
 
   addEmail,
   addFax,
   addContact,
   updateEmail,
   updateFax,
   updateContact,
   deleteEmail,
   deleteFax,
   deleteContact
};