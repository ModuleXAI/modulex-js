import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Notifications Resource', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: Modulex;

  beforeEach(() => {
    mockFetch = vi.fn();
    client = new Modulex({
      apiKey: 'mx_live_test',
      organizationId: 'org-1',
      fetch: mockFetch,
    });
  });

  it('should list notifications (GET /notifications) and read the union variants', async () => {
    const listData = {
      success: true,
      total: 3,
      organization_id: 'org-1',
      notifications: [
        {
          notification_type: 'invitation',
          id: 'inv-1',
          message: 'You are invited',
          created_at: '2026-01-01T00:00:00Z',
          organization_id: 'org-7',
          organization_name: 'Acme',
          role: 'member',
          invited_by_email: 'boss@acme.dev',
        },
        {
          notification_type: 'system',
          id: 'sys-1',
          message: 'Scheduled maintenance',
          created_at: '2026-01-02T00:00:00Z',
          notification_topic: 'notice',
          notified_at: '2026-01-02T00:00:00Z',
        },
        {
          notification_type: 'organization',
          id: 'org-n-1',
          message: 'New integration available',
          created_at: '2026-01-03T00:00:00Z',
          organization_id: 'org-1',
          notification_topic: 'integration',
          notified_at: '2026-01-03T00:00:00Z',
          is_broadcast: true,
        },
      ],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(listData));

    const result = await client.notifications.list();

    // Correct HTTP method + path
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/notifications');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');

    // Return type is read correctly
    expect(result.success).toBe(true);
    expect(result.total).toBe(3);
    expect(result.organization_id).toBe('org-1');
    expect(result.notifications).toHaveLength(3);

    // Discriminated union keyed on `notification_type`
    const [invitation, system, organization] = result.notifications;

    expect(invitation.notification_type).toBe('invitation');
    if (invitation.notification_type === 'invitation') {
      expect(invitation.organization_name).toBe('Acme');
      expect(invitation.role).toBe('member');
    }

    expect(system.notification_type).toBe('system');
    if (system.notification_type === 'system') {
      expect(system.notification_topic).toBe('notice');
      expect(system.notified_at).toBe('2026-01-02T00:00:00Z');
    }

    expect(organization.notification_type).toBe('organization');
    if (organization.notification_type === 'organization') {
      expect(organization.is_broadcast).toBe(true);
      expect(organization.organization_id).toBe('org-1');
      expect(organization.notification_topic).toBe('integration');
    }
  });

  it('should handle a null organization_id in the list response', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, total: 0, organization_id: null, notifications: [] }),
    );

    const result = await client.notifications.list();

    expect(result.organization_id).toBeNull();
    expect(result.notifications).toEqual([]);
  });

  it('should create an organization notification (POST /notifications/organization) with camelCase -> snake_case body', async () => {
    const createData = {
      success: true,
      notification: {
        id: 'n-1',
        organization_id: 'org-1',
        notification_topic: 'integration',
        message: 'Hello team',
        notification_url: 'https://example.com',
        created_at: '2026-06-19T00:00:00Z',
        notified_at: '2026-06-19T00:00:00Z',
        expires_at: null,
        is_broadcast: false,
        notified_to: 'user-9',
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(createData));

    const result = await client.notifications.create({
      notificationTopic: 'integration',
      message: 'Hello team',
      notifiedTo: 'user-9',
      notificationUrl: 'https://example.com',
      expiresAt: '2026-12-31T00:00:00Z',
    });

    // Correct HTTP method + path
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('/notifications/organization');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');

    // camelCase params are converted to snake_case on the wire
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.notification_topic).toBe('integration');
    expect(body.message).toBe('Hello team');
    expect(body.notified_to).toBe('user-9');
    expect(body.notification_url).toBe('https://example.com');
    expect(body.expires_at).toBe('2026-12-31T00:00:00Z');

    // Return type ({ success, notification }) is read correctly
    expect(result.success).toBe(true);
    expect(result.notification.id).toBe('n-1');
    expect(result.notification.is_broadcast).toBe(false);
    expect(result.notification.notified_to).toBe('user-9');
    expect(result.notification.notification_topic).toBe('integration');
  });

  it('should send the X-Organization-ID header for create from client config', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        notification: {
          id: 'n-2',
          organization_id: 'org-1',
          notification_topic: 'attention',
          message: 'Broadcast',
          created_at: '2026-06-19T00:00:00Z',
          notified_at: '2026-06-19T00:00:00Z',
          is_broadcast: true,
        },
      }),
    );

    await client.notifications.create({
      notificationTopic: 'attention',
      message: 'Broadcast',
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    const orgHeader =
      headers instanceof Headers ? headers.get('X-Organization-ID') : headers['X-Organization-ID'];
    expect(orgHeader).toBe('org-1');
  });
});
