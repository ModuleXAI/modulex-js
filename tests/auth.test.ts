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

  it('me() should GET /auth/me and read the user shape', async () => {
    const userData = {
      id: 'u1',
      email: 'test@example.com',
      username: 'tester',
      role: 'USER',
      is_active: true,
      organization_ids: ['org-1', 'org-2'],
      primary_organization_id: 'org-1',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(userData));

    const result = await client.auth.me();

    expect(result).toEqual(userData);
    expect(result.organization_ids).toHaveLength(2);
    expect(result.primary_organization_id).toBe('org-1');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/me');
    expect(init.method).toBe('GET');
  });

  it('organizations() should GET /auth/me/organizations with role query and read nested membership records', async () => {
    const orgData = {
      success: true,
      user_id: 'u1',
      organizations: [
        {
          id: 'org-1',
          name: 'Acme',
          slug: 'acme',
          domain: 'acme.com',
          role: 'admin',
          joined_at: '2024-01-01T00:00:00Z',
          is_default: true,
        },
      ],
      total: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(orgData));

    const result = await client.auth.organizations({ role: 'admin' });

    expect(result.success).toBe(true);
    expect(result.user_id).toBe('u1');
    // /auth/me/organizations uses `total` (NOT total_count) — see audit 6.x.
    expect(result.total).toBe(1);
    expect(result.organizations[0].joined_at).toBe('2024-01-01T00:00:00Z');
    expect(result.organizations[0].is_default).toBe(true);
    expect(result.organizations[0].domain).toBe('acme.com');

    const [url, init] = mockFetch.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.pathname).toContain('/auth/me/organizations');
    expect(parsed.searchParams.get('role')).toBe('admin');
    expect(init.method).toBe('GET');
  });

  it('organizations() should omit the role query param when not provided', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, user_id: 'u1', organizations: [], total: 0 }),
    );

    await client.auth.organizations();

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.has('role')).toBe(false);
  });

  it('invitations() should GET /auth/invitations/my and read the nested invitation shape', async () => {
    const invData = {
      success: true,
      invitations: [
        {
          id: 'inv-1',
          organization: { id: 'org-1', name: 'Acme', slug: 'acme', domain: 'acme.com' },
          invited_by: { id: 'u9', email: 'owner@acme.com', username: 'owner' },
          role: 'member',
          status: 'pending',
          invitation_message: 'join us',
          created_at: '2024-01-01T00:00:00Z',
          expires_at: '2024-02-01T00:00:00Z',
          days_until_expiry: 0,
        },
      ],
      total_count: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(invData));

    const result = await client.auth.invitations();

    expect(result.success).toBe(true);
    // /auth/invitations/my envelope uses total_count (NOT total) — audit 6.2.
    expect(result.total_count).toBe(1);
    const inv = result.invitations[0];
    // Nested objects, not flat organization_id / invited_email — audit 6.1.
    expect(inv.organization.id).toBe('org-1');
    expect(inv.organization.domain).toBe('acme.com');
    expect(inv.invited_by.email).toBe('owner@acme.com');
    // days_until_expiry can legitimately be 0.
    expect(inv.days_until_expiry).toBe(0);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/invitations/my');
    expect(init.method).toBe('GET');
  });

  it('acceptInvitation() should POST /auth/invitations/{id}/accept and read the rich response', async () => {
    const accepted = {
      success: true,
      message: 'Invitation accepted',
      organization: { id: 'org-1', name: 'Acme', slug: 'acme' },
      role: 'member',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(accepted));

    const result = await client.auth.acceptInvitation('inv-1');

    expect(result.success).toBe(true);
    expect(result.organization?.id).toBe('org-1');
    expect(result.role).toBe('member');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/invitations/inv-1/accept');
    expect(init.method).toBe('POST');
  });

  it('rejectInvitation() should POST /auth/invitations/{id}/reject and read a success ack', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'Rejected' }));

    const result = await client.auth.rejectInvitation('inv-1');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Rejected');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/invitations/inv-1/reject');
    expect(init.method).toBe('POST');
  });

  it('leaveOrganization() should POST /auth/organizations/leave with org context and read nested shape', async () => {
    const leaveData = {
      success: true,
      message: 'Left organization',
      left_organization: { id: 'org-1', name: 'Acme', slug: 'acme' },
      remaining_organizations: [
        {
          id: 'org-2',
          name: 'Beta',
          slug: 'beta',
          domain: null,
          role: 'member',
          joined_at: '2024-03-01T00:00:00Z',
          is_default: false,
        },
      ],
      total_remaining: 1,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(leaveData));

    const result = await client.auth.leaveOrganization({ organizationId: 'org-1' });

    expect(result.success).toBe(true);
    expect(result.left_organization.slug).toBe('acme');
    expect(result.remaining_organizations[0].is_default).toBe(false);
    expect(result.total_remaining).toBe(1);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/organizations/leave');
    expect(init.method).toBe('POST');
    // organizationId from RequestOptions is sent as X-Organization-ID header.
    expect(init.headers['X-Organization-ID']).toBe('org-1');
  });
});
