const GeneralInfoService = require('../services/generalInfoService');
 
const getRecordsForGeneralInfo = async (req, res) => {
  try {
    const {hospitalId}=req.params;
    const data = await GeneralInfoService.getGeneralInfo(hospitalId);
    res.json(data);
    console.log("getRecordsForGeneralInfo",data);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
   
  }
};

const getRecordsForProcessAutomated = async (req, res) => {
  try {
    const {hospitalId}=req.params;
    const data = await GeneralInfoService.getProcessAutomated(hospitalId);
    res.json(data);
    console.log("process Automated",data);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
   
  }
};

const getRecordsForMarketingIniti = async (req, res) => {
  try {
    const {hospitalId}=req.params;
    const data = await GeneralInfoService.getMarketingIniti(hospitalId);
    res.json(data);
    console.log("Marketing Initi",data);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    res.status(500).json({ error: 'Internal Server Error' });
   
  }
};




const updateGeneralInfo = async (req, res) => {
  try{
    const hospitalId = req.params.hospitalId;
    console.log("generalInfoController >> updateGeneralInfo request received");
    const updatedDetails = req.body.genInfoData;
    const valuesArray = req.body.valuesArray;
    console.info("generalInfoController >> updateGeneralInfo processing");
    const result = await GeneralInfoService.updateGeneralInfoService(hospitalId, updatedDetails, valuesArray);
    res.json(result);
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Internal Server Error' });
}
}
const updateMarketingIniti = async (req, res) => {
  try{
    const hospitalId = req.params.hospitalId;
    const updatedDetails = req.body;
    console.info("generalInfoController >> updateMarketingIniti request received");
    const result = await GeneralInfoService.updateMarketingIniti(hospitalId, updatedDetails);
    res.json(result);

    
} catch (error) {
  console.error("Error Updating data:", error.message);
  res.status(500).json({ error: 'Internal Server Error' });
  
}
}
const addMarketingData = async (req, res) => {
  try {
    const event = req.body;
    const result = await GeneralInfoService.addMarketingData(event);
    res.json(result);
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') { // Check if the error is due to duplicate entry
      res.status(400).json({ error: 'data already exists' }); // Send a custom error response
    } else {
      res.status(500).json({ error: 'Internal Server Error' }); // For other errors, send a generic internal server error response
    } }
};

const deleteMarketingData = async (req, res) => {
  try {
    const campaign_type = req.params.campaignType;
    console.log("In Controller",campaign_type);
    const result = await GeneralInfoService.deleteMarketingData(campaign_type);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
    
  }
};
module.exports={
    getRecordsForGeneralInfo,
    getRecordsForProcessAutomated,
    getRecordsForMarketingIniti,
    updateGeneralInfo,
    updateMarketingIniti,
    addMarketingData,
    deleteMarketingData

};