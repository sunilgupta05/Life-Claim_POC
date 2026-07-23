const e = require('cors');
const email_fax_contactDao = require('../dataAccess/email_fax_contact');


const addEmail = async (event) => {
    const result = await email_fax_contactDao.addEmail(event);
    return { result };
  };

  const addFax = async (event) => {
    const result = await email_fax_contactDao.addFax(event);
    return { result };
  };

  const addContact = async (event) => {
    const result = await email_fax_contactDao.addContact(event);
    return { result };
  };

  const updateEmailService = async (hospitalId, event) => {
    const result = await email_fax_contactDao.updateEmail(hospitalId, event);
    return { result };
  };

  const updateFaxService = async (hospitalId, event) => {
    const result = await email_fax_contactDao.updateFax(hospitalId, event);
    return { result };
  };

  const updateContactService = async (hospitalId, event) => {
    const result = await email_fax_contactDao.updateContact(hospitalId, event);
    return { result };
  };

  const deleteEmail = async (hospital_email) => {
    const result = await email_fax_contactDao.deleteEmail(hospital_email);
    return { result };
  };
  
  const deleteFax = async (fax_no) => {
    const result = await email_fax_contactDao.deleteFax(fax_no);
    return { result };
  };
  
  const deleteContact = async (hospital_phone) => {
    const result = await email_fax_contactDao.deleteContact(hospital_phone);
    return { result };
  };
  
  module.exports={addEmail,addFax,addContact,updateEmailService,updateFaxService,updateContactService,deleteEmail,deleteFax,deleteContact} ;