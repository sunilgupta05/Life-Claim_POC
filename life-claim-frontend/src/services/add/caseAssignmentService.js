import wrapper from '../../util/ApiWrapper';
import * as XLSX from 'xlsx';
import { normalizePolicyNumber } from '../../components/add/addCaseMappers';

const getAuthenticatedUser = () => {
    const username = sessionStorage.getItem('loggedUser');
    if (!username) {
        throw new Error('No authenticated user found');
    }
    return { username };
};

export const readExcelFileData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const worksheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[worksheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    reject(new Error('File must contain header row and at least one data row'));
                    return;
                }

                const headers = jsonData[0].map((h) => String(h || '').trim().toUpperCase());
                const policyIdx = headers.indexOf('POLICY_ID');
                const assignIdx = headers.indexOf('ASSIGNED_TO');
                if (policyIdx < 0 || assignIdx < 0) {
                    reject(new Error('Header row must include POLICY_ID and ASSIGNED_TO'));
                    return;
                }

                const processedData = jsonData.slice(1).map((row) => ({
                    POLICY_ID: String(row[policyIdx] ?? '').trim(),
                    ASSIGNED_TO: String(row[assignIdx] ?? '').trim(),
                })).filter((row) => row.POLICY_ID && row.ASSIGNED_TO);

                resolve(processedData);
            } catch (error) {
                reject(new Error('Error reading file. Please check the file format.'));
            }
        };

        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsArrayBuffer(file);
    });
};

export function downloadAssignmentTemplate() {
    const headers = ['POLICY_ID', 'ASSIGNED_TO'];
    const sample = [['04027489', 'atharva']];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Assignment');
    XLSX.writeFile(wb, 'case_assignment_template.xlsx');
}

export async function getAssignmentReferenceData() {
    const response = await wrapper.fetchWithToken('/caseassignment/policynumberusername', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    const payload = result?.data || result;
    const policies = (payload?.responsePolicyNumber || []).map((p) =>
        normalizePolicyNumber(typeof p === 'string' ? p : p.policy_number || p.POLICY_NUMBER)
    ).filter(Boolean);
    const usernames = (payload?.responseUsername || []).map((u) =>
        typeof u === 'string' ? u : u.username || u.USERNAME
    ).filter(Boolean);
    return { policies, usernames };
}

export async function assignCasesToUser(caseIds, assignedTo) {
    const { username } = getAuthenticatedUser();
    const response = await wrapper.fetchWithToken('/caseassignment/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            caseIds,
            assignedTo,
            assignedBy: username,
        }),
    });
    const result = await response.json();
    if (!result?.success) {
        throw new Error(result?.message || result?.error || 'Assignment failed');
    }
    return result;
}

export async function CaseAssignmentService(processedData) {
    const { username } = getAuthenticatedUser();
    const { policies: dbPolicyNumber, usernames: dbUsername } = await getAssignmentReferenceData();
    const dbPolicySet = new Set(dbPolicyNumber.map(normalizePolicyNumber));
    const dbUserSet = new Set(dbUsername.map((u) => String(u).trim()));

    const validationErrors = [];
    const validData = [];

    processedData.forEach((item, index) => {
        const policyId = normalizePolicyNumber(item.POLICY_ID);
        const assignedTo = String(item.ASSIGNED_TO || '').trim();
        const isPolicyValid = dbPolicySet.has(policyId);
        const isUsernameValid = dbUserSet.has(assignedTo);

        if (!isPolicyValid || !isUsernameValid) {
            const errors = [];
            if (!isPolicyValid) errors.push(`Policy ID ${item.POLICY_ID} was not found`);
            if (!isUsernameValid) errors.push(`Username ${assignedTo} not found in users`);
            validationErrors.push({ row: index + 2, policyId: item.POLICY_ID, assignedTo, errors });
        } else {
            validData.push({ POLICY_ID: policyId, ASSIGNED_TO: assignedTo });
        }
    });

    if (validationErrors.length > 0) {
        const errorMessage = validationErrors.map((error) =>
            `Row ${error.row}: ${error.errors.join(', ')}`
        ).join('; ');
        throw new Error(`Validation failed: ${errorMessage}`);
    }

    if (!validData.length) {
        throw new Error('No valid data found to process');
    }

    const response = await wrapper.fetchWithToken('/caseassignment/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: validData, uploadedBy: username }),
    });
    const result = await response.json();
    if (!result?.success) {
        throw new Error(result?.message || 'Bulk assignment failed');
    }
    const updated = result.data?.updated?.length ?? validData.length;
    const failed = result.data?.failed?.length ?? 0;
    return {
        success: true,
        message: result.message || `Assigned ${updated} policy row(s)${failed ? `; ${failed} failed` : ''}.`,
        data: result.data,
    };
}
