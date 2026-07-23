import { API_URL } from '../../util/config';
import wrapper from '../../util/ApiWrapper';

// Utility function to get authenticated user information
const getAuthenticatedUser = () => {
    const username = sessionStorage.getItem("loggedUser");
    if (!username) {
        throw new Error("No authenticated user found");
    }
    return { username };
};

export const AssessmentPool = async (attribute, value, exclusionFilter = null, offset = 0, limit = 10) => {
    console.log('AssessmentPool.js >> AssessmentPool called with attribute:', attribute, 'value:', value, 'exclusionFilter:', exclusionFilter, 'offset:', offset, 'limit:', limit);
    try {
        const { username } = getAuthenticatedUser();
        const response = await wrapper.fetchWithToken(`/Assessment/pool`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                attribute: attribute || null,
                value: value || null,
                exclusionFilter: exclusionFilter,
                offset: offset,
                limit: limit
            })
        })
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        const assessmentPoolData = await response.json();
        console.log('AssessmentPool.js >> Response:', assessmentPoolData);
        return assessmentPoolData;
    } catch (error) {
        console.error('Error fetching assessment pool:', error);
        throw error;
    }
}

export const closeCasesAsExclusion = async (caseIds, reason, remarks) => {
    try {
        const response = await wrapper.fetchWithToken(`/Assessment/closeCasesAsExclusion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caseIds, reason, remarks })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error closing cases:', error);
        throw error;
    }
};

export const moveCasesToBeReferred = async (caseIds) => {
    try {
        const response = await wrapper.fetchWithToken(`/Assessment/moveCasesToBeReferred`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caseIds })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error moving cases:', error);
        throw error;
    }
};

export const getCaseDetails = async (caseId) => {
    try {
        const response = await wrapper.fetchWithToken(`/Assessment/getCaseDetails`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ caseId })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching case details:', error);
        throw error;
    }
}

export const refreshLifeAsiaData = async (caseId) => {
    console.log('AssessmentPool.js >> refreshLifeAsiaData called with caseId:', caseId);
    try {
        const { username } = getAuthenticatedUser();
        const response = await wrapper.fetchWithToken(`/Assessment/refreshLifeAsiaData`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                caseId: caseId,
                username: username
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error refreshing Life Asia data:', error);
        throw error;
    }
};
