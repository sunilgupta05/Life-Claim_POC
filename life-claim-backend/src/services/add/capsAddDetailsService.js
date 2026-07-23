const CapsAddDetailsDao = require('../../dataAccess/add/capsAddDetailsDao');
/**service it not used in the add screen "capsAddDetails" controller directly call the dao */
const AddDataToTable = () =>{
    const addValue = CapsAddDetailsDao.insertCapsAddDetails();
}