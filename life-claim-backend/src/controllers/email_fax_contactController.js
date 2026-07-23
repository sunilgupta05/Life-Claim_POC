const pool = require('../config/dbConfig');
const email_fax_contactService = require('../services/email_fax_contactService');





const addEmailToEntity = async (req, res) => {
    try {
      const event = req.body;
      const result = await email_fax_contactService.addEmail(event);
      res.json(result);
    } catch (error) {
      console.error(error);
      if (error.code === 'ER_DUP_ENTRY') { // Check if the error is due to duplicate entry
        res.status(400).json({ error: 'Email already exists' }); // Send a custom error response
      } else {
        res.status(500).json({ error: 'Internal Server Error' }); // For other errors, send a generic internal server error response
      } }
  };

  const addFaxToEntity = async (req, res) => {
    try {
      const event = req.body;
      const result = await email_fax_contactService.addFax(event);
      res.json(result);
    } catch (error) {
      console.error(error);
      if (error.code === 'ER_DUP_ENTRY') { // Check if the error is due to duplicate entry
        res.status(400).json({ error: 'Fax already exists' }); // Send a custom error response
      } else {
        res.status(500).json({ error: 'Internal Server Error' }); // For other errors, send a generic internal server error response
      }   }
  };

  const addContactToEntity = async (req, res) => {
    try {
      const event = req.body;
      const result = await email_fax_contactService.addContact(event);
      res.json(result);
    } catch (error) {
      console.error(error);
      if (error.code === 'ER_DUP_ENTRY') { // Check if the error is due to duplicate entry
        res.status(400).json({ error: 'Contact already exists' }); // Send a custom error response
      } else {
        res.status(500).json({ error: 'Internal Server Error' }); // For other errors, send a generic internal server error response
      }  }
  };

  const updateEmail = async (req, res) => {
    try{
      const hospitalId = req.params.hospitalId;
      const updatedDetails = req.body;
      console.info("inside controller fin", updatedDetails);
      const result = await email_fax_contactService.updateEmailService(hospitalId, updatedDetails);
      res.json(result);
  } catch (error) {
    console.error("Error Updating data:", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  }

  const updateFax = async (req, res) => {
    try{
      const hospitalId = req.params.hospitalId;
      const updatedDetails = req.body;
      console.info("inside controller fin", updatedDetails);
      const result = await email_fax_contactService.updateFaxService(hospitalId, updatedDetails);
      res.json(result);
  } catch (error) {
    console.error("Error Updating data:", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  }

  const updateContact = async (req, res) => {
    try{
      const hospitalId = req.params.hospitalId;
      const updatedDetails = req.body;
      console.info("inside controller fin", updatedDetails);
      const result = await email_fax_contactService.updateContactService(hospitalId, updatedDetails);
      res.json(result);
  } catch (error) {
    console.error("Error Updating data:", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
  }
  
  
  

  const deleteEmailFromEntity = async (req, res) => {
    try {
      const hospital_email = req.params.hospital_email;
      console.log("In Controller",hospital_email);
      const result = await email_fax_contactService.deleteEmail(hospital_email);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const deleteFaxFromEntity = async (req, res) => {
    try {
      const fax_no = req.params.fax_no;
      const result = await email_fax_contactService.deleteFax(fax_no);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  const deleteContactFromEntity = async (req, res) => {
    try {
      const hospital_phone = req.params.hospital_phone;
      const result = await email_fax_contactService.deleteContact(hospital_phone);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  module.exports={
   
    addEmailToEntity,
    addFaxToEntity,
    addContactToEntity,
    updateEmail,
    updateFax,updateContact,
    deleteEmailFromEntity,
    deleteFaxFromEntity,
    deleteContactFromEntity
  };