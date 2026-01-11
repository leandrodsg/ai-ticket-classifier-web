/**
 * Decodes a base64 encoded CSV string
 * @param base64String - The base64 encoded CSV string
 * @returns The decoded CSV string
 * @throws Error if the base64 string is invalid
 */
export function decodeBase64Csv(base64String: string): string {
  try {
    // Decode base64 to UTF-8 string
    const decoded = atob(base64String);
    return decoded;
  } catch {
    throw new Error('Invalid base64 string provided');
  }
}

/**
 * Parses CSV metadata from the decoded CSV string
 * @param csvContent - The full decoded CSV content
 * @returns Object with metadata fields
 * @throws Error if metadata is malformed
 */
export function parseCsvMetadata(csvContent: string): {
  version: string;
  signature: string;
  timestamp: string;
  session_id: string;
  row_count: number;
  nonce: string;
  expires_at: string;
} {
  const lines = csvContent.split('\n');
  const metadata: Record<string, string> = {};

  let inMetadata = false;
  for (const line of lines) {
    if (line.trim() === '# METADATA - DO NOT EDIT THIS SECTION') {
      inMetadata = true;
      continue;
    }
    if (line.trim() === '# END METADATA') {
      break;
    }
    if (inMetadata && line.startsWith('# ')) {
      const [key, ...valueParts] = line.substring(2).split(': ');
      if (key && valueParts.length > 0) {
        metadata[key.trim()] = valueParts.join(': ').trim();
      }
    }
  }

  // Validate required fields
  const requiredFields = ['version', 'signature', 'timestamp', 'session_id', 'row_count', 'nonce', 'expires_at'];
  for (const field of requiredFields) {
    if (!metadata[field]) {
      throw new Error(`Missing required metadata field: ${field}`);
    }
  }

  return {
    version: metadata.version,
    signature: metadata.signature,
    timestamp: metadata.timestamp,
    session_id: metadata.session_id,
    row_count: parseInt(metadata.row_count, 10),
    nonce: metadata.nonce,
    expires_at: metadata.expires_at,
  };
}

/**
 * Validates basic CSV metadata (expiration check)
 * @param metadata - Parsed metadata object
 * @returns True if valid, throws error if invalid
 */
export function validateCsvMetadata(metadata: ReturnType<typeof parseCsvMetadata>): boolean {
  const now = new Date();
  const expiresAt = new Date(metadata.expires_at);

  if (isNaN(expiresAt.getTime())) {
    throw new Error('Invalid expires_at timestamp in CSV metadata');
  }

  if (now > expiresAt) {
    throw new Error('CSV has expired. Please generate a new one.');
  }

  // Check nonce length (should be 32 chars as per backend)
  if (metadata.nonce.length !== 32) {
    throw new Error('Invalid nonce format in CSV metadata');
  }

  return true;
}