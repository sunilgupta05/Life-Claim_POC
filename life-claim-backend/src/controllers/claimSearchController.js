const claimSearchService = require('../services/claimSearchService');

const getClaimSearch = async (req, res) => {
  try {
    const { claimNumber } = req.body;
    console.log('Received claim number:', claimNumber); // Log the input
    if (!claimNumber) {
      return res.status(400).json({ message: 'claim number is required' });
    }

    const claim = await claimSearchService.getClaimSearchService(claimNumber);
    if (!claim) {
      return res.status(404).json({ message: 'claim no not found' });
    }
     res.status(200).json(claim);
  } catch (error) {
    // console.error('Error searching for policy:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const updateAssessor = async (req, res) => {
  try {
    const { assessor,claimNumber, username } = req.body;

    if (!assessor || !claimNumber) {
      console.error('Missing assessor or claimNumber in request');
      return res.status(400).json({ message: 'No fields to be edited or claimNumber missing' });
    }

    const data = await claimSearchService.updateAssessorFields(assessor,claimNumber,username);
    console.log(data)
    if (!data) {
      return res.status(404).json({ message: 'no data to edit' });
    }
     res.status(200).json(data);
  } catch (error) {
    // console.error('Error searching for policy:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
const updateVerifier = async (req, res) => {
  try {
    
    const { verifier,claimNumber, username } = req.body;
    console.log(verifier)
    if (!verifier || !claimNumber) {
      return res.status(400).json({ message: 'no fields to be editted' });
    }

    const data = await claimSearchService.updateVerifierFields(verifier,claimNumber, username);
    if (!data) {
      return res.status(404).json({ message: 'no data to edit' });
    }
     res.status(200).json(data);
  } catch (error) {
    // console.error('Error searching for policy:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
    getClaimSearch,updateAssessor,updateVerifier
};