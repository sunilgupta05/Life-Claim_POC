const pool = require('../config/dbConfig');


const getRecordsforEmail_fax_contact = async (hospitalId) => {
    console.info('in hospital Serach Name', hospitalId);
    const [email] = await pool.execute('SELECT * FROM caps_hospital_email WHERE HOSPITAL_ID = ?', [hospitalId]);
    const [fax] = await pool.execute('SELECT * FROM caps_hospital_fax_no WHERE HOSPITAL_ID = ?', [hospitalId]);
    const [contact] = await pool.execute('SELECT * FROM caps_hospital_contactno WHERE HOSPITAL_ID = ?', [hospitalId]);
    
    const row={};
    console.log("email",email,"fax",fax,"contact",contact);
    if(email.length > 0){
        row.email = email;
    }
    else{
        row.email = [];
    }
    if(fax.length > 0){
        row.fax = fax;
    }
    else{
        row.fax = [];
    }
    if(contact.length > 0){
        row.contact = contact;
    }
    else{
        row.contact = [];
    }
    return row;
  
  };

  module.exports={
    getRecordsforEmail_fax_contact
  }