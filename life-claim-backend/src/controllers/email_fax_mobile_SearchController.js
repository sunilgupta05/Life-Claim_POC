const email_fax_mobile_SearchService = require('../services/email_fax_mobile_SearchService');

exports.getRecordsforEmail_fax_contact = async (req, res) => {
  try {
    const {hospitalId}=req.params;
    const data = await email_fax_mobile_SearchService.getRecordsforEmail_fax_contact(hospitalId);
    res.json(data);
  } catch (error) {
   
  }
};

