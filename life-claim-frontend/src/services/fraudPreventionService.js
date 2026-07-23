import { API_URL } from '../util/config';
import userDetailsService from './userService';
import wrapper from '../util/ApiWrapper';

//To get the data for rule 1
const fraudPreventionService = async (pincode, city) => {
    console.log('Services >> fraudPreventionService.js >> Pincode > ', pincode, '\n City > ', city);
    const response = await wrapper.fetchWithToken(`/fraudprevention/getSafeCityPincodeCheck`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pincode, city })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Rule 1 check failed: ${response.status} - ${errorText}`);
    }
    const fraudPreventionData = await response.json();
    console.log('Services >> fruadPreventionService.js >> fraudPreventionData > ', fraudPreventionData);
    return fraudPreventionData;
}

//To get the data for rule 2
const ruleTwoService = async (claimant) => {
    console.log('Services >> FraudPreventionService.js >> ruleTwoService Methed called ');
    const ruleTwoResponse = await wrapper.fetchWithToken(`/fraudprevention/claimant_Bankdetails_Check`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ claimant: claimant || null }),
        });
    if (!ruleTwoResponse.ok) {
        const errorText = await ruleTwoResponse.text();
        return `Server error: ${ruleTwoResponse.status} - ${errorText}`;
    }
    const ruleTwoData = await ruleTwoResponse.json();
    console.log('Services >> FraudPreventionService.js >> ruleTwoData > ', ruleTwoData);
    return ruleTwoData;
}

//To get the data for rule 3
const ruleThreeService = async (source) => {
    console.log('Services >> FraudPreventionService.js >> ruleThreeService Methed called ');
    const ruleThreeResponse = await wrapper.fetchWithToken(`/fraudprevention/agent_Trend_Check`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ source })
        }
    );
    if (!ruleThreeResponse.ok) {
        const errorText = await ruleThreeResponse.text();
        return `Server error: ${ruleThreeResponse.status} - ${errorText}`;
    }
    const ruleThreeData = await ruleThreeResponse.json();
    console.log('Services >> FraudPreventionService.js >> ruleThreeData > ', ruleThreeData);
    return ruleThreeData;
}

// Rule 4 — body: { numbers: { LA_number1, LA_number2 } }
const ruleFourService = async (numbers) => {
    const payload = numbers?.LA_number1 != null || numbers?.LA_number2 != null
      ? { numbers }
      : { numbers: { LA_number1: numbers?.[0] || '', LA_number2: numbers?.[1] || '' } }
    try {
        const ruleFourResponse = await wrapper.fetchWithToken(`/fraudprevention/mobile_Number_Check`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!ruleFourResponse.ok) {
            const errorText = await ruleFourResponse.text();
            return `Server error: ${ruleFourResponse.status} - ${errorText}`;
        }
        const ruleFourData = await ruleFourResponse.json();
        console.log('Services >> FraudPreventionService.js >> ruleFourData > ', ruleFourData);
        return ruleFourData;
    } catch (error) {
        console.log('Services >> FraudPreventionService.js >> ruleFourService Error > ', error);
        return error;
    }

}

// To add the Accessor feedback for visible rules 
const addAccessorFeedback = async (feedback, claimNumber, roleOverride, usernameOverride) => {
    const username = usernameOverride || sessionStorage.getItem('loggedUser');

    console.log('Services >> FraudPreventionService.js >> addAccessorFeedback Methed called ', feedback, '\n Username > ', username, '\n Claim Number > ', claimNumber);

    try {
        let role = roleOverride;
        if (!role) {
            const userDetails = await userDetailsService.getUserById(username);
            role = userDetails?.roles?.[0] || 'Assessor';
        }
        const addAccessorFeedbackResponse = await wrapper.fetchWithToken(`/fraudprevention/add_remarks_decisions`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ feedback, claimNumber, role, username })
            },
        );
        console.log('After Response...');
        console.log('Services >> FraudPreventionService.js >> Response status: ', addAccessorFeedbackResponse.status);
        if (!addAccessorFeedbackResponse.ok) {
            const errorText = await addAccessorFeedbackResponse.text();
            throw new Error(`Server error: ${addAccessorFeedbackResponse.status} - ${errorText}`);
        }
        const addAccessorFeedbackData = await addAccessorFeedbackResponse.json();
        if (addAccessorFeedbackData?.success === false) {
            throw new Error(addAccessorFeedbackData.message || 'Failed to save eagle rule feedback');
        }
        return addAccessorFeedbackData;
    } catch (error) {
        console.error('Services >> FraudPreventionService.js >> addAccessorFeedback Error > ', error);
        throw error;
    }
}

//To get the existing feedback based on the claim number to decide to update or add
export const getExistingFeedback = async (claimNumber) => {
    console.log('FraudPrevetionModal.jsx >> FraudPrevetionModal >> getExistingFeedback >> claimNumber: >>', claimNumber);
    try {
        const response = await wrapper.fetchWithToken(`/fraudprevention/get_eagle_rule_details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ claimNumber })
        });

        if (response.ok) {
            const existingFeedback = await response.json();
            console.log('FraudPrevetionModal.jsx >> FraudPrevetionModal >> getExistingFeedback >> existingFeedback: >>', JSON.stringify(existingFeedback));
            return existingFeedback;
        } else {
            console.error('Error response from server:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            return null;
        }
    } catch (error) {
        console.error('Error fetching existing feedback:', error);
        return null;
    }
};

export const updateAccessorFeedback = async (feedback, claimNumber) => {
    console.log('FraudPrevetionModal.jsx >> FraudPrevetionModal >> updateAccessorFeedback >> feedback: >>', feedback, '\n claimNumber: >>', claimNumber);
    try {
        const response = await wrapper.fetchWithToken(`/fraudprevention/update_eagle_rule_details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feedback, claimNumber })
        });
        if (response.ok) {
            return await response.json();
        } else {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('Error updating feedback:', error);
        throw error;
    }
};

export { fraudPreventionService, ruleTwoService, ruleThreeService, ruleFourService, addAccessorFeedback };