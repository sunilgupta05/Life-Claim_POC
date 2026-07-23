const claimSearchDao = require('../dataAccess/claimSearchDao');
const { camelToSnakeCase, snakeToCamelCase } = require("../util/convertCase");

const getClaimSearchService = async (claimNumber) => {
  try {
    const claim = await claimSearchDao.claimSearchInDB(claimNumber);
    return claim;
  } catch (error) {
    //console.error('DAO Error:', error.message); // Log specific DAO error
    throw new Error('Error in service while fetching claim no');
  }
};

const updateAssessorFields= async (assessor,claimNumber, username) => {
  try {
    const assessorSnake = camelToSnakeCase(assessor);
    const data = await claimSearchDao.editAssessor(assessorSnake, claimNumber, username);
    return data;
  } catch (error) {
    console.error('DAO Error:', error.message);
    throw new Error('Error in service');
  }
};

const updateVerifierFields= async (verifier,claimNumber,username) => {
  try {
    const verifierSnake = camelToSnakeCase(verifier);
    const data = await claimSearchDao.editVerifier(verifierSnake,claimNumber, username);
    return data;
  } catch (error) {
    console.error('DAO Error:', error.message);
    throw new Error('Error in service');
  }
};

module.exports = {
    getClaimSearchService,updateAssessorFields,updateVerifierFields
};
