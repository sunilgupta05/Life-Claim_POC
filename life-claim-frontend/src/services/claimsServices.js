import authService from "./authService";
import { API_URL } from "../util/config";

const claimsServices = {
    getClaimByUsername: async (username) => {
        try {
            const response = await fetch(`${API_URL}/api/claims/claimByUsername`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username }),
            });

            if (!response.ok) {
                console.error('Failed to fetch claims for user:', response.status);
                return [];
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching claims:', error);
            return [];
        }
    },
    assignClaim: async (claims, username) => {
        try {
            const response = await fetch(`${API_URL}/api/claims/assignClaim`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ claims, username }),
            });
            const data = await response.json();
            if (response.ok) return data;
            console.error('Data search for pool error:', data.message);
            return null;
        } catch (error) {
            console.error('Error during search:', error);
            return null;
        }
    }
};

export default claimsServices;