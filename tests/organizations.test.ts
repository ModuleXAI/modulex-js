import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modulex } from '../src/client';

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Organizations Resource', () => {
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

  it('should create an organization (POST /organizations)', async () => {
    const data = {
      success: true,
      message: 'created',
      organization: {
        id: 'o1',
        name: 'Acme',
        slug: 'acme',
        domain: null,
        is_active: true,
        created_at: '2026-06-19T00:00:00Z',
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.create({ name: 'Acme', slug: 'acme' });

    expect(result.organization.id).toBe('o1');
    expect(result.organization.is_active).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe('Acme');
    expect(body.slug).toBe('acme');
  });

  it('should list LLM integrations (GET /organizations/llms)', async () => {
    const data = {
      success: true,
      total: 2,
      active_llm_total: 1,
      inactive_llm_total: 1,
      active_llms: [{ integration_name: 'openrouter' }],
      inactive_llms: [{ integration_name: 'openai' }],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.llms();

    expect(result.total).toBe(2);
    expect(result.active_llm_total).toBe(1);
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/llms');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should invite a user (POST /organizations/invite) with camelCase -> snake_case body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'invited' }));

    const result = await client.organizations.invite({
      invitedEmail: 'a@b.com',
      role: 'admin',
      invitationMessage: 'join us',
    });

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/invite');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.invited_email).toBe('a@b.com');
    expect(body.role).toBe('admin');
    expect(body.invitation_message).toBe('join us');
  });

  it('should cancel an invitation (POST /organizations/invitations/{id}/cancel) with no body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'canceled' }));

    const result = await client.organizations.cancelInvitation('inv-1');

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/invitations/inv-1/cancel');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('should reinvite (POST /organizations/invitations/{id}/reinvite) with no body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'reinvited' }));

    const result = await client.organizations.reinvite('inv-1');

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/invitations/inv-1/reinvite');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('should update a member role (PUT /organizations/{orgId}/users/{userId}/role)', async () => {
    const data = {
      success: true,
      message: 'updated',
      user_id: 'u1',
      organization_id: 'o1',
      new_role: 'admin',
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.updateRole('o1', 'u1', { role: 'admin' });

    expect(result.new_role).toBe('admin');
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/o1/users/u1/role');
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.role).toBe('admin');
  });

  it('should remove a user (DELETE /organizations/{orgId}/users/{userId})', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, message: 'removed' }));

    const result = await client.organizations.removeUser('o1', 'u1');

    expect(result.success).toBe(true);
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/o1/users/u1');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('should preview invite cost (POST /organizations/invite/preview) with no body — available', async () => {
    const data = {
      preview_available: true,
      interval: 'month',
      new_quantity: 5,
      amount_due: 12.5,
      currency: 'usd',
      proration_line_amount: 12.5,
      immediate: false,
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.invitePreview();

    expect(result.preview_available).toBe(true);
    if (result.preview_available) {
      expect(result.new_quantity).toBe(5);
      expect(result.currency).toBe('usd');
    }
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/invite/preview');
    expect(mockFetch.mock.calls[0][1].method).toBe('POST');
    expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it('should preview invite cost — unavailable discriminant', async () => {
    const data = { preview_available: false, reason: 'no_active_subscription' };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.invitePreview();

    expect(result.preview_available).toBe(false);
    if (!result.preview_available) {
      expect(result.reason).toBe('no_active_subscription');
    }
  });

  it('should get organization settings (GET /organizations/settings)', async () => {
    const data = {
      llm_model_visibility: {
        openrouter: [{ id: 'gpt-4', display_name: 'GPT-4' }],
      },
      composer_llm: {
        integration_name: 'openrouter',
        provider_id: 'openai',
        model_id: 'gpt-4',
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.getSettings();

    expect(result.composer_llm?.model_id).toBe('gpt-4');
    expect(result.llm_model_visibility.openrouter[0].id).toBe('gpt-4');
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/settings');
    expect(mockFetch.mock.calls[0][1].method).toBe('GET');
  });

  it('should set model visibility (PUT /organizations/settings/llm-model-visibility) with camelCase -> snake_case body', async () => {
    const data = {
      llm_model_visibility: {
        openrouter: [{ id: 'gpt-4', display_name: 'GPT-4' }],
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.setModelVisibility({
      integrationName: 'openrouter',
      models: [{ id: 'gpt-4', display_name: 'GPT-4' }],
    });

    expect(result.llm_model_visibility.openrouter[0].id).toBe('gpt-4');
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/settings/llm-model-visibility');
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.integration_name).toBe('openrouter');
    expect(body.models[0].display_name).toBe('GPT-4');
  });

  it('should set composer LLM (PUT /organizations/settings/composer-llm) with camelCase -> snake_case body', async () => {
    const data = {
      composer_llm: {
        integration_name: 'openrouter',
        provider_id: 'openai',
        model_id: 'gpt-4',
        credential_id: 'cred-1',
      },
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(data));

    const result = await client.organizations.setComposerLlm({
      integrationName: 'openrouter',
      providerId: 'openai',
      modelId: 'gpt-4',
      credentialId: 'cred-1',
    });

    expect(result.composer_llm?.model_id).toBe('gpt-4');
    expect(mockFetch.mock.calls[0][0]).toContain('/organizations/settings/composer-llm');
    expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.integration_name).toBe('openrouter');
    expect(body.provider_id).toBe('openai');
    expect(body.model_id).toBe('gpt-4');
    expect(body.credential_id).toBe('cred-1');
  });
});
