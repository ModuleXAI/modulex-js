# Changelog

## 1.0.0 — Big Refactor (backend catch-up)

> Aşamalı (P0–P5) refactor; tam denetim ve plan `BIG_REFACTOR_AUDIT/` altında. Bu sürüm, SDK'yı canlı backend sözleşmesine hizalar ve birden çok **breaking** değişiklik içerir (SSE discriminant `event`→`type`, `PaginatedList` tip değişimi, `InvitationObject` nested, bare-array dönüşler, Templates kaldırımı, `composer.history()`→`list()`). Migrasyon için aşağıdaki bölümlere ve `BIG_REFACTOR_AUDIT/01-MASTER-REFACTOR-PLAN.md`'ye bakın.
>
> **Kapsam kararları:** Subscriptions/billing, Admin ve WebSocket realtime bilinçli olarak SDK kapsamı dışındadır (user-facing SDK). Requests/Support eklenmedi. System health-check uçları (public `health()` + ops `oauthHealth()`) da SDK'dan çıkarıldı (client özelliği değil).

### Removed (kapsam daraltma — kullanıcı kararı)
- **`client.subscriptions`** resource'u tamamen kaldırıldı (billing kapsam dışı; kırık `checkoutLink` dahil tüm billing yüzeyi). Tipler de kaldırıldı (Plan, Subscription, BillingResponse, Checkout*, Portal*).
- **`system.health()`** (public liveness) ve **`system.oauthHealth()`** (ops diagnostiği, ayrı `X-Health-API-Key` gerektirir) kaldırıldı; `system` artık yalnızca `timezones()`/`searchTimezones()`. İlgili health tipleri ve `base._getRaw` helper'ı da kaldırıldı.
- Sonuç: **17 resource / 130 endpoint** (önceki 18/136).

### Breaking changes — migrasyon özeti
- **SSE:** Tüm execution/composer/assistant stream'lerinde olay tipini `event.event` yerine `event.type` ile ayırın. Flat (`node_update`/`error`) vs wrapped (`data.*`) zarflara dikkat.
- **PaginatedList<T>:** artık `items?: T[]` içeriyor ve `total` opsiyonel.
- **Templates:** `client.templates` kaldırıldı (backend'de yok).
- **Composer:** `history()` → `list()` (GET /composer/chats); `save()`/`revert()` artık `workflow_sync` taşıyan tipli yanıt döndürür.
- **Executions:** `run()` artık `llm`/`systemWorkflow` modlarını kabul etmez (assistant'a taşındı); SSE union yeniden tasarlandı.
- **Auth:** `InvitationObject` nested; `InvitationsResponse.total`→`total_count`.
- **Knowledge/Integrations:** liste uçları artık dizi döndürür (eski zarf/map tipleri kaldırıldı).

### P4 / P5 — System & Health, Deployments, docs

#### Added
- **`system.oauthHealth(healthApiKey)`** — GET /system/health/oauth diagnostiği; `X-Health-API-Key` header'ı ile (Bearer'ı bastıran yeni `_getRaw` transport helper'ı). Yeni `src/types/system.ts` (`TimezoneOption/Group/ListResponse`, `HealthReport`, `CheckResult`, `CheckStatus`, `SystemHealthResponse`).

#### Changed
- **System:** `timezones()` → `TimezoneListResponse`, `searchTimezones()` → `TimezoneOption[]` (önceden tipsiz `Record`/yanlış obje şekli).
- **Deployments:** `DeploymentResponse.workflow_id` opsiyonel, `deployed_by` → `string | null`; `Activate/DeactivateDeploymentResponse.previous_live_deployment_id` opsiyonel; `DeploymentDetailResponse.description` eklendi.
- **README:** yeni resource'lar (assistant, workflowRuns), SSE `event.type` örnekleri, HITL resume akışı, hata zarfı `code/reason`, WebSocket kapsam-dışı bölümü; endpoint sayısı güncellendi.

#### Removed
- **`system.metrics()`** — backend'de `/system/metrics` yok (hayalet endpoint, hep 404).

#### Decisions (P4)
- **WebSocket realtime:** Seçenek B — SDK kapsamı dışında belgelendi (Clerk-JWT/Socket.IO/camelCase wire uyumsuzluğu). Gerekirse ayrı `@modulex/realtime` paketi.

### P3 — Drift Düzeltmeleri (10 domain; Subscriptions/billing & System hariç)

#### Added
- **`credentials.initiateOAuth2()`** (POST /credentials/oauth2/initiate) ve **`credentials.refreshOAuth2()`** (POST /credentials/{id}/oauth2/refresh) — eksik user-facing OAuth2 endpoint'leri (admin/owner) + `InitiateOAuth2Params`/`OAuth2InitiateResponse` ve `CredentialDetailResponse`/`AuditLogResponse`/`MCPServerCredentialResponse` tipleri.
- **`organizations`**: `invitePreview()`, `getSettings()`, `setModelVisibility()`, `setComposerLlm()` + ilgili tipler.
- Tipli SSE/discriminated-union'lar: `notifications` (`NotificationResponse` union), `chats` (`ChatConnectedEvent`/`ChatListUpdatedEvent`), dashboard analytics zarf tipleri.

#### Changed (runtime bug + tip drift düzeltmeleri)
- **Knowledge (runtime-kırıcı):** `list()` ve `documents()` artık `KnowledgeBaseResponse[]` / `DocumentResponse[]` (bare array) döndürüyor — eskiden yanlış zarf/Record tipliyordu. `search`/`hybridSearch` yanıtı `{matches, total_matches, ...}` (eski `{results, total}`); `ChunkingConfig.overlap`→`chunk_overlap` (sessiz veri kaybı düzeltmesi); `EmbeddingConfig` alan adları; `DocumentResponse.file_size`→`file_size_bytes`.
- **Integrations (runtime-kırıcı):** `tools()`/`llmProviders()`/`knowledgeProviders()` artık `IntegrationMetadata[]` (dizi) döndürüyor — eskiden `Record` (map) tipliyordu. `BrowseResponse.has_more` (hayalet `total_pages` kaldırıldı); detay tipleri `IntegrationDetail`'e hizalandı (doğru alan adları, `auth_schemas`).
- **Auth:** `InvitationObject` nested (`organization{}`/`invited_by{}`/`days_until_expiry`) — eski düz alanlar runtime'da `undefined`'dı; `InvitationsResponse.total`→`total_count`; `OrganizationInfo` `joined_at`/`domain`/`is_default`; `acceptInvitation()` zengin dönüş tipi.
- **Credentials:** `audit()` artık `AuditLogResponse[]` (dizi — gerçek bug); `get()` → `CredentialDetailResponse`; nullability düzeltmeleri.
- **Schedules:** `pause()`/`resume()` → `ScheduleResponse`; `ScheduleRunResponse`/`RunStatsResponse` drift; `delete()`/`retryRun()` tipleri.
- **Dashboard:** analytics/log/users yanıtları somut tiplendi (önceden gevşek). **API Keys:** `ApiKeyResponse` zorunlu alanlar, hayalet `is_revoked` kaldırıldı. **Chats:** `ChatMessagesResponse` hayalet pagination alanları kaldırıldı.

#### Notlar
- **System & Health** ve **Subscriptions/Billing** bu fazda kullanıcı kararıyla DIŞ bırakıldı.
- `notifications` system/organization broadcast (admin) ve `schedules/admin/trigger-tick` eklenmedi (kapsam dışı).

### P2 — Yeni Resource: Assistant

#### Added
- **`client.assistant`** yeni resource (`/assistant`, 8 metot): `chat()`, `list()` (GET /assistant/chats, cursor-paginated), `get()`, `listen()` (tipli `AssistantSSEEvent` SSE), `resume()` (HITL), `status()`, `cancel()`, `delete()`. Composer ile yapısal olarak benzer ama workflow'a bağlı DEĞİL (save/revert/focus yok; `workflow_id`/`snapshot_status` yok). `src/types/assistant.ts` + paylaşımlı `src/types/hitl.ts` (P1) union'larını kullanır.

#### Notlar
- **Requests/Support resource'u bilinçli olarak EKLENMEDİ** (kullanıcı kararı): 3 endpoint'in 1'i admin-only, 2 create endpoint'i ise SDK'nın user-facing kapsamı için şimdilik dışarıda bırakıldı.
- **Admin** ve **WebSocket** zaten kapsam dışı (önceki kararlar).

### P1 — Çekirdek Yürütme Yüzeyi (Workflows + Executions + Composer)

#### Added
- **`client.workflowRuns`** yeni resource — kalıcı (durable) run geçmişi: `list(params)` (GET /workflow-runs) + `get(runPk)` (GET /workflow-runs/{run_pk}). Tipler: `WorkflowRunListParams/Item/ListResponse`, `WorkflowRunDetail`. (`runPk` = tablo PK'sı, `run_id` DEĞİL.)
- **`executions.listen()`** artık tipli `WorkflowSSEEvent` (discriminated union, `data.type` üzerinden) yayıyor; `node_started` ve `cancelled` event'leri eklendi; wrapped (metadata/interrupt/resumed/done/cancelled) vs flat (node_started/node_update/error) zarflar birebir modellendi.
- **`workflows.listenChanges(workflowId)`** — GET /workflows/{id}/changes collaboration SSE stream'i (`WorkflowChangeEvent`).
- **`composer.resume()`** — HITL yanıt akışı (POST /composer/chat/{id}/resume); `composer.focus()` (PATCH); `composer.list()` (GET /composer/chats, cursor-paginated).
- **Paylaşılan HITL tipleri** (`src/types/hitl.ts`): `UserInputRequest`/`UserInputResponse` discriminated union'ları (kind ile), `ChoiceOption`, `CredentialAuthOption`, `CredentialFailureCode`. Composer ve (P2) Assistant tarafından paylaşılır.
- `LoopConfig`: `iterations_ref`, `parallel`, `accumulate`, `accumulate_from`; `LLMNodeConfig`: `structured_output_strict`, `prompt_template` (deprecated alias); `WorkflowSummary.input`.

#### Changed
- **`composer.listen()`** artık tipli `ComposerSSEEvent` yayıyor (`user_input_request` HITL tetikleyicisi dahil); `save()`/`revert()` artık opsiyonel `{ workflowId }` gövdesi alıp `workflow_sync` taşıyan tipli yanıt (`ComposerSaveResponse`/`ComposerRevertResponse`) döndürüyor.
- `WorkflowRunParams`: kaldırılmış `llm`/`systemWorkflow` modları çıkarıldı (410 GONE), `attributionWorkflowId` eklendi, ölü `organizationId` kaldırıldı. `WorkflowRunResponse`: `workflow_source` enum daraltıldı, `human_message`/`ai_message` somut `WorkflowMessageEnvelope` tipine bağlandı.
- `BuilderDetailsResponse`: `categories` artık OBJECT (`{tools,functions,transformers}`), `features` eklendi, `counts`/`node_types` tiplendi.
- `NodeDefinition.x`/`.y` ve `AgentNodeConfig.system_prompt` zorunlu yapıldı (backend 422'sini yansıtır). `WorkflowSummary.creator_id` → `string | null`.
- `delete()` JSDoc düzeltildi (HARD delete, irreversible); `create`/`update`/`delete` admin/owner notu; `cancel`/`resume` guard kodları belgelendi.
- `WorkflowListParams`/`BuilderDetailsParams`'tan ölü `organizationId` kaldırıldı.

#### Removed
- **`composer.history()`** kaldırıldı (backend'de B6'da silinen workflow-scoped endpoint'i hedefliyordu) → yerine `composer.list()`. `ComposerHistoryParams` → `ComposerListParams`.
- `ComposerChatDetailResponse.snapshot_status` (uydurma alan) kaldırıldı; `title`, `running_id`, `touched_workflow_ids`, `pending_user_input_request` eklendi.

> **DOKUNULMADI (çürütülen iddialar):** `LLMConfig.model_id` (required doğru), `user_prompt` (kanonik), `ConditionalNodeConfig` alan adları, `NodeType` knowledge/guardrails — bunlar backend'le uyumlu, değiştirilmedi.

### P0 — Transport / Contract temeli

#### Changed
- **SSE:** `SSEEvent`'e semantik `type` alanı eklendi. ModuleX stream'lerinin çoğu (workflows, composer, assistant, credentials) data-only frame yayar ve gerçek tip `data.type` içindedir; tüketiciler artık `event` yerine `type` üzerinden ayrım yapmalı. `event` alanı geriye uyumluluk için korundu. (additive)
- **Hata zarfı:** Hata mesajı ayrıştırması artık dict-şekilli `detail` (rate-limit) ve `detail` sarmalayıcısı olmayan flat top-level zarfı (BillingDenied) ele alıyor. `ModulexError` artık `code`, `reason`, `layer` alanlarını yüzeye çıkarıyor. (additive)
- **RateLimitError:** `X-RateLimit-Limit/Remaining/Reset` header'larından `limit`, `remaining`, `reset` alanları eklendi. (additive)
- **PaginatedList<T>:** `items?: T[]` alanı eklendi; `total` opsiyonel yapıldı (cursor/has_next uçlarıyla uyum). (breaking-type)
- `config.ts`: base URL dokümantasyonu netleştirildi (kök montaj, version prefix yok).

#### Removed
- **Templates resource tamamen kaldırıldı** (`resources/templates.ts`, `types/templates.ts` + wiring). Backend'de hiçbir `/templates` route'u yok; 9 metodun tümü 404 dönüyordu (ölü kod). README endpoint sayısı 122 → 113.

## 0.1.0 (2026-03-09)

### Added
- Initial release of the ModuleX JavaScript/TypeScript SDK
- Full coverage of all 125 API endpoints
- TypeScript type definitions for all request/response objects
- SSE streaming support for workflow execution, composer, and chat events
- Automatic retry with exponential backoff for transient errors
- Auto-pagination helpers via AsyncIterable
- File upload support for knowledge base documents
- Dual ESM + CJS build output
- Zero runtime dependencies
