export const UPLOAD_ALLOWED_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'zip']
export const UPLOAD_ACCEPT = UPLOAD_ALLOWED_EXT.map((e) => `.${e}`).join(',')
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024

/** Shared client-side checks for claim document uploads. */
export function validateUploadFile(file) {
  if (!file) {
    return { valid: false, message: 'Choose a file to upload.' }
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !UPLOAD_ALLOWED_EXT.includes(ext)) {
    return { valid: false, message: `Allowed types: ${UPLOAD_ALLOWED_EXT.join(', ')}` }
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return { valid: false, message: 'Maximum file size is 10 MB.' }
  }
  if (file.size === 0) {
    return { valid: false, message: 'The selected file is empty.' }
  }
  return { valid: true }
}
