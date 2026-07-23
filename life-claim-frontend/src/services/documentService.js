import wrapper from '../util/ApiWrapper';

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const FORBIDDEN_DOC_MSG = 'You are not allowed to view documents for this claim.';

const parseServiceError = (err) => {
  const raw = err?.message || String(err || '');
  if (raw.includes('403') || raw.toLowerCase().includes('forbidden')) {
    return new Error(FORBIDDEN_DOC_MSG);
  }
  return err instanceof Error ? err : new Error(raw || 'Request failed');
};

const documentService = {
  getDocumentList: async () => {
    try {
      const response = await wrapper.fetchWithToken(`/documents/documentList`);
      const payload = await response.json().catch(() => null);
      return normalizeArrayPayload(payload);
    } catch (e) {
      throw parseServiceError(e);
    }
  },

  getUploadedDocumentList: async (claimId) => {
    try {
      const response = await wrapper.fetchWithToken('/uploaded/uploadedDocuments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId }),
      });
      const payload = await response.json().catch(() => null);
      return normalizeArrayPayload(payload);
    } catch (e) {
      throw parseServiceError(e);
    }
  },

  getUploadedDocumentListCount: async (claimId, documentType) => {
    try {
      const response = await wrapper.fetchWithToken('/uploaded/getDocumentCount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, documentType: documentType || '' }),
      });
      return response.json().catch(() => null);
    } catch (e) {
      throw parseServiceError(e);
    }
  },
};

export default documentService;
export { FORBIDDEN_DOC_MSG };
