import { API_URL } from '../../util/config';
import wrapper from '../../util/ApiWrapper';

const searchCaseTableData = async (attribute, value, limit, offset) => {
    console.log(`attribute: ${attribute}, value: ${value}, limit: ${limit}, offset: ${offset}`);
    try{
        const response = await wrapper.fetchWithToken(`/case-search/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({attribute, value, limit, offset})
        })
        if (!response.ok){
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        const TableData = await response.json();
        console.log(TableData);
        return TableData;
    }catch(e){
        console.log(e);
        throw e;
    }
}

export {searchCaseTableData}