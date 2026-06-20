import { type ModulexConfig, type ResolvedConfig, resolveConfig } from './config';
import {
  Auth, ApiKeys, Organizations, Workflows, Executions, WorkflowRuns, Deployments,
  Chats, Credentials, Integrations, Knowledge, Schedules,
  Composer, Assistant, Dashboard, Notifications, System,
} from './resources';

/**
 * The main ModuleX client. Provides access to all API resources.
 *
 * @example
 * ```typescript
 * import { Modulex } from 'modulex';
 *
 * const client = new Modulex({
 *   apiKey: 'mx_live_...',
 *   organizationId: 'your-org-id',
 * });
 *
 * const me = await client.auth.me();
 * const workflows = await client.workflows.list({ status: 'active' });
 * ```
 */
export class Modulex {
  /** @internal */
  private readonly _config: ResolvedConfig;

  // Lazy-initialized resource instances
  private _auth?: Auth;
  private _apiKeys?: ApiKeys;
  private _organizations?: Organizations;
  private _workflows?: Workflows;
  private _executions?: Executions;
  private _workflowRuns?: WorkflowRuns;
  private _deployments?: Deployments;
  private _chats?: Chats;
  private _credentials?: Credentials;
  private _integrations?: Integrations;
  private _knowledge?: Knowledge;
  private _schedules?: Schedules;
  private _composer?: Composer;
  private _assistant?: Assistant;
  private _dashboard?: Dashboard;
  private _notifications?: Notifications;
  private _system?: System;

  constructor(config: ModulexConfig) {
    this._config = resolveConfig(config);
  }

  /** Authentication and user profile endpoints. */
  get auth(): Auth {
    return (this._auth ??= new Auth(this._config));
  }

  /** API key management endpoints. */
  get apiKeys(): ApiKeys {
    return (this._apiKeys ??= new ApiKeys(this._config));
  }

  /** Organization management endpoints. */
  get organizations(): Organizations {
    return (this._organizations ??= new Organizations(this._config));
  }

  /** Workflow CRUD endpoints. */
  get workflows(): Workflows {
    return (this._workflows ??= new Workflows(this._config));
  }

  /** Workflow execution-control endpoints (run, resume, cancel, listen). */
  get executions(): Executions {
    return (this._executions ??= new Executions(this._config));
  }

  /** Durable workflow run-history endpoints (list, get persisted runs). */
  get workflowRuns(): WorkflowRuns {
    return (this._workflowRuns ??= new WorkflowRuns(this._config));
  }

  /** Workflow deployment endpoints. */
  get deployments(): Deployments {
    return (this._deployments ??= new Deployments(this._config));
  }

  /** Chat endpoints. */
  get chats(): Chats {
    return (this._chats ??= new Chats(this._config));
  }

  /** Credential management endpoints. */
  get credentials(): Credentials {
    return (this._credentials ??= new Credentials(this._config));
  }

  /** Integration browsing endpoints. */
  get integrations(): Integrations {
    return (this._integrations ??= new Integrations(this._config));
  }

  /** Knowledge base endpoints. */
  get knowledge(): Knowledge {
    return (this._knowledge ??= new Knowledge(this._config));
  }

  /** Schedule management endpoints. */
  get schedules(): Schedules {
    return (this._schedules ??= new Schedules(this._config));
  }

  /** Composer (AI workflow builder) endpoints. */
  get composer(): Composer {
    return (this._composer ??= new Composer(this._config));
  }

  /** Assistant (HITL chat agent) endpoints. */
  get assistant(): Assistant {
    return (this._assistant ??= new Assistant(this._config));
  }

  /** Dashboard and analytics endpoints. */
  get dashboard(): Dashboard {
    return (this._dashboard ??= new Dashboard(this._config));
  }

  /** Notification endpoints. */
  get notifications(): Notifications {
    return (this._notifications ??= new Notifications(this._config));
  }

  /** System health and utility endpoints. */
  get system(): System {
    return (this._system ??= new System(this._config));
  }
}
