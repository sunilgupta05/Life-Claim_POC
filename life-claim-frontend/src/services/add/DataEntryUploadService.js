import wrapper from '../../util/ApiWrapper';
import * as XLSX from 'xlsx';

const ALLOWED_EXTENSIONS = ['.xls', '.xlsx', '.csv'];
const ALLOWED_MIME_TYPES = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv',
    'text/plain',
];

const getAuthenticatedUsername = () => {
    const username = sessionStorage.getItem('loggedUser');
    if (!username) {
        throw new Error('No authenticated user found');
    }
    return username;
};

export function isAllowedDataEntryFile(file) {
    if (!file) return false;
    const name = String(file.name || '').toLowerCase();
    if (ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) return true;
    if (file.type && ALLOWED_MIME_TYPES.includes(file.type)) return true;
    return false;
}

export function downloadDataEntryTemplate() {
    const headers = ['POLICY_NUMBER', 'SOURCE', 'REFERRAL_DATE', 'REMARKS'];
    const sample = [['04027489', 'Referral', '15-03-2024', 'Initial intake']];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'caps_data_entry_template.xlsx');
}

function pickField(row, ...keys) {
    for (const key of keys) {
        if (row[key] != null && String(row[key]).trim() !== '') return row[key];
    }
    const normalized = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [String(k).trim().toUpperCase().replace(/\s+/g, '_'), v])
    );
    for (const key of keys) {
        if (normalized[key] != null && String(normalized[key]).trim() !== '') return normalized[key];
    }
    return null;
}

function normalizeUploadRow(row) {
    return {
        POLICY_NUMBER: pickField(row, 'POLICY_NUMBER'),
        SOURCE: pickField(row, 'SOURCE') || 'Excel',
        REFERRAL_DATE: pickField(row, 'REFERRAL_DATE'),
        REMARKS: pickField(row, 'REMARKS', 'REMARK'),
    };
}

async function ExcelUploaderService(file) {
    const username = getAuthenticatedUsername();
    const parsed = await readExcelFile(file);
    const data = parsed
        .map(normalizeUploadRow)
        .filter((row) => row.POLICY_NUMBER && row.REFERRAL_DATE);

    if (!data.length) {
        throw new Error('No valid rows found. Each row needs POLICY_NUMBER and REFERRAL_DATE.');
    }

    const response = await wrapper.fetchWithToken('/capsAddDetails/addValue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, username }),
    });

    const result = await response.json();
    if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Upload failed');
    }

    const count = Array.isArray(result.data) ? result.data.length : data.length;
    return {
        ...result,
        message: result.message || `Successfully uploaded ${count} record(s). Policy enrichment and exclusion rules will run in the background.`,
    };
}

function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const isCsv = String(file.name || '').toLowerCase().endsWith('.csv');

        reader.onload = (e) => {
            try {
                const workbook = isCsv
                    ? XLSX.read(e.target.result, { type: 'string' })
                    : XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                resolve(jsonData);
            } catch {
                reject(new Error('Error reading file. Use .xls, .xlsx, or .csv with a header row.'));
            }
        };

        reader.onerror = () => reject(new Error('Error reading file'));

        if (isCsv) reader.readAsText(file);
        else reader.readAsArrayBuffer(file);
    });
}

async function searchWithUserInput(attribute, value, caseType, page = 0, limit = 10) {
    const username = getAuthenticatedUsername();
    const response = await wrapper.fetchWithToken('/capsAddDetails/getData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseType, attribute, value, username, page, limit }),
    });
    const result = await response.json();
    if (result?.success === false) {
        throw new Error(result.error || result.message || 'Search failed');
    }
    return result;
}

async function approveData(selectedData, caseStatus) {
    const caseId = [...new Set(
        (selectedData || []).map((item) => item.CASE_ID ?? item.case_id ?? item.caseId).filter(Boolean)
    )];
    if (!caseId.length) throw new Error('No case IDs selected');
    const username = getAuthenticatedUsername();
    const response = await wrapper.fetchWithToken('/capsAddDetails/approver-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId, caseStatus, username }),
    });
    const result = await response.json();
    if (result?.success === false) {
        throw new Error(result.error || result.message || 'Approve failed');
    }
    return result;
}

async function rejectData(selectedData, caseStatus) {
    return approveData(selectedData, caseStatus);
}

async function resetAddDemoData() {
    const response = await wrapper.fetchWithToken('/capsAddDetails/resetDemoData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    const result = await response.json();
    if (!result?.success) {
        throw new Error(result?.error || result?.message || 'Reset failed');
    }
    return result;
}

export { ExcelUploaderService, searchWithUserInput, approveData, rejectData, resetAddDemoData };
