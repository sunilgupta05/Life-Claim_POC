import wrapper from '../../util/ApiWrapper';

export const getDecisionMasterData = async () => {
    try {
        const response = await wrapper.fetchWithToken(`/Assessment/decisionMasterData`, {
            method: 'GET',
        });
        return await response.json();
    } catch (error) {
        console.error('Error in getDecisionMasterData service:', error);
        throw error;
    }
};

export const saveFindings = async (findings, username) => {
    try {
        const response = await wrapper.fetchWithToken(`/Assessment/saveFindings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ findings, username })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error in saveFindings service:', error);
        throw error;
    }
};

export const saveDecision = async (decisionData, username) => {
    try {
        const response = await wrapper.fetchWithToken(`/Assessment/saveDecision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ decisionData, username })
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error in saveDecision service:', error);
        throw error;
    }
};
