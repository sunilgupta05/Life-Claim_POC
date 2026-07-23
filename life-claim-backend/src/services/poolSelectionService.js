const poolSelectionDao = require('../dataAccess/poolSelectionDao');

const getPoolDataService = async (selectedPool) => {
  try {
    const claims = await poolSelectionDao.getPoolDataInDB(selectedPool);
    return claims;
  } catch (error) {
    //console.error('DAO Error:', error.message); // Log specific DAO error
    throw new Error('Error in service while fetching data');
  }
};

const updateAssignedUser = async (claimNumber, LoggedUser, role) => {
  try {
    const UpdateUser = await poolSelectionDao.updateAssignedUserInDB(claimNumber, LoggedUser, role);
    return UpdateUser;
  } catch (error) {
    //console.error('DAO Error:', error.message); // Log specific DAO error
    throw new Error('Error in service while fetching data');
  }
};

module.exports = {
    getPoolDataService,updateAssignedUser
};
