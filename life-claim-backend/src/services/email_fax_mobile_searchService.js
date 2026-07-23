const e = require('cors');
const email_fax_mobile_Search =require('../dataAccess/email_fax_mobile_search');


exports.getRecordsforEmail_fax_contact = (hospitalId) => {
    return email_fax_mobile_Search.getRecordsforEmail_fax_contact(hospitalId);
    
  };

 