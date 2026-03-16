import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Auth Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({ apiKey: 'mx_live_test', fetch: mockFetch });
  });

  it('should get current user', async () => {
    const userData = { id: 'u1', email: 'test@example.com', role: 'USER' };
    mockFetch.mockResolvedValueOnce(jsonResponse(userData));

    const result = await client.auth.me();

    expect(result).toEqual(userData);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/me');
    expect(init.method).toBe('GET');
  });

  it('should list organizations with role filter', async () => {
    const orgData = { success: true, organizations: [], total: 0 };
    mockFetch.mockResolvedValueOnce(jsonResponse(orgData));

    const result = await client.auth.organizations({ role: 'admin' });

    expect(result).toEqual(orgData);
    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('role')).toBe('admin');
  });

  it('should get invitations', async () => {
    const invData = { invitations: [] };
    mockFetch.mockResolvedValueOnce(jsonResponse(invData));

    const result = await client.auth.invitations();

    expect(result).toEqual(invData);
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/invitations/my');
  });

  it('should accept invitation', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const result = await client.auth.acceptInvitation('inv-1');

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/invitations/inv-1/accept');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
  });

  it('should reject invitation', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const result = await client.auth.rejectInvitation('inv-1');

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/invitations/inv-1/reject');
  });

  it('should leave organization', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Left' }));

    const result = await client.auth.leaveOrganization({ organizationId: 'org-1' });

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][1].headers['X-Organization-ID']).toBe('org-1');
  });
});
