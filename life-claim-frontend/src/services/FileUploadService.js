import { API_URL } from '../util/config';

const fileUploadService = {
  /** Backend accepts one file per request (multer max 1). */
  fileUpload: async ({ claimNo, documentType, documentId, files }) => {
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) throw new Error('No file selected');
    const claim = String(claimNo || '').trim();
    if (!claim) throw new Error('Claim number is required for upload.');
    if (!documentType) throw new Error('Document type is required.');

    const formData = new FormData();
    formData.append('claimNo', claim);
    formData.append('documentType', documentType);
    formData.append('documentId', documentId ?? '');
    formData.append('files', file);

    const response = await fetch(`${API_URL || ''}/api/upload/uploadFile`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    const raw = await response.text().catch(() => '');
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      payload = {};
    }

    if (!response.ok) {
      const msg = payload?.message || payload?.detail || raw || `Upload failed (${response.status})`;
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }

    const message = payload?.message || payload?.msg || 'File uploaded successfully';
    return { ...payload, message };
  },
};

export default fileUploadService;
