import { describe, it, expect } from 'vitest';
import { decodeBase64Csv, parseCsvMetadata, validateCsvMetadata } from './base64-decoder';

describe('decodeBase64Csv', () => {
  it('decodes valid base64 CSV string correctly', () => {
    const base64Csv = 'dGlja2V0X2lkLHN1YmplY3QscHJpb3JpdHksY2F0ZWdvcnkKMSxMb2dpbiBpc3N1ZXMsSGlnaCxBdXRoZW50aWNhdGlvbgo';
    const expected = 'ticket_id,subject,priority,category\n1,Login issues,High,Authentication\n';

    const result = decodeBase64Csv(base64Csv);
    expect(result).toBe(expected);
  });

  it('handles empty string', () => {
    const result = decodeBase64Csv('');
    expect(result).toBe('');
  });

  it('throws error for invalid base64', () => {
    expect(() => decodeBase64Csv('invalid-base64!')).toThrow();
  });

  it('returns decoded string for valid base64', () => {
    const base64Csv = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
    const expected = 'Hello World';

    const result = decodeBase64Csv(base64Csv);
    expect(result).toBe(expected);
  });
});

describe('parseCsvMetadata', () => {
  it('parses valid CSV metadata correctly', () => {
    const csvContent = `# METADATA - DO NOT EDIT THIS SECTION
# version: v1
# signature: a1b2c3d4e5f678901234567890123456789012345678901234567890123456789012
# timestamp: 2025-12-26T20:00:00Z
# session_id: 550e8400-e29b-41d4-a716-446655440000
# row_count: 20
# nonce: a3c7b2f4d9e1a8b5c6d7e8f9
# expires_at: 2025-12-26T21:00:00Z
# END METADATA
Issue Key,Summary
DEMO-001,Test ticket`;

    const result = parseCsvMetadata(csvContent);
    expect(result).toEqual({
      version: 'v1',
      signature: 'a1b2c3d4e5f678901234567890123456789012345678901234567890123456789012',
      timestamp: '2025-12-26T20:00:00Z',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      row_count: 20,
      nonce: 'a3c7b2f4d9e1a8b5c6d7e8f9',
      expires_at: '2025-12-26T21:00:00Z',
    });
  });

  it('throws error for missing required metadata field', () => {
    const csvContent = `# METADATA - DO NOT EDIT THIS SECTION
# version: v1
# signature: a1b2c3d4...
# END METADATA
Issue Key,Summary`;

    expect(() => parseCsvMetadata(csvContent)).toThrow('Missing required metadata field: timestamp');
  });
});

describe('validateCsvMetadata', () => {
  it('validates metadata with future expiration', () => {
    const metadata = {
      version: 'v1',
      signature: 'a1b2c3d4...',
      timestamp: '2026-01-11T20:00:00Z',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      row_count: 20,
      nonce: '12345678901234567890123456789012',
      expires_at: '2026-01-11T21:00:00Z', // Future date
    };

    expect(() => validateCsvMetadata(metadata)).not.toThrow();
  });

  it('throws error for expired metadata', () => {
    const metadata = {
      version: 'v1',
      signature: 'a1b2c3d4...',
      timestamp: '2025-01-01T20:00:00Z',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      row_count: 20,
      nonce: 'a3c7b2f4d9e1a8b5c6d7e8f9',
      expires_at: '2025-01-01T21:00:00Z', // Past date
    };

    expect(() => validateCsvMetadata(metadata)).toThrow('CSV has expired');
  });

  it('throws error for invalid nonce length', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);
    const metadata = {
      version: 'v1',
      signature: 'a1b2c3d4...',
      timestamp: '2026-01-11T20:00:00Z',
      session_id: '550e8400-e29b-41d4-a716-446655440000',
      row_count: 20,
      nonce: 'short', // Invalid length
      expires_at: futureDate.toISOString(),
    };

    expect(() => validateCsvMetadata(metadata)).toThrow('Invalid nonce format');
  });
});