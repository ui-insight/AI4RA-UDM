# UDM System of Engagement: Sample Shapes

The System of Engagement is the OLTP layer adjacent to UDM. It holds the non-UDM application infrastructure that user-facing applications need: auth, session state, AI configuration, in-flight wizard drafts, application configuration, observability events. UDM does not specify the System of Engagement's data model; institutions choose their own based on application stack and deployment.

This document is reference material: sample shapes for what an institution might model in the System of Engagement, the contract between the SoE and UDM, and the kinds of data that explicitly do NOT belong here. The sample shapes are illustrative, not normative; the UDM specification does not prescribe them.

---

## What the SoE holds

Application infrastructure that is not source-of-truth research-admin data and is not derived from UDM data:

- **Authentication and authorization.** User accounts, credentials, role assignments to application roles, session tokens, revocation lists.
- **Session state.** Live sessions, server-side session metadata.
- **AI configuration.** LLM endpoint registrations, model selection, workflow-to-endpoint mappings, prompt versions, AI budget tracking.
- **In-flight wizard drafts.** Partial form data being saved between page transitions or autosaves, before the data is finalized into UDM.
- **Application configuration.** Feature flags, UI preferences, institutional branding, integration endpoint URLs.
- **Observability events.** Operator actions, page views, telemetry events, audit traces of explicit user behavior that are not row changes to UDM data.
- **Notifications and inbox state.** Front-end notification queues, read/unread state, user notification preferences.
- **Job queues and worker state.** Background-job records, retry counts, dead-letter queues.

The SoE is the OLTP layer in the three-layer architecture: optimized for many small writes, indexed point-lookups, sub-second response, ACID transactions, high concurrency on individual rows. PostgreSQL is the typical choice; any transactional database with appropriate semantics works.

---

## What the SoE does NOT hold

Two categories of data explicitly do NOT belong in the SoE:

1. **UDM source-of-truth data.** Proposals, Awards, Protocols, Personnel, Organizations, and the rest of the UDM domain entities live in the System of Record. Finalized data materializes into UDM at the appropriate lifecycle transition (e.g., wizard draft becomes a `Proposal` row on submission). The SoE may cache UDM data for read performance, but the cache is not the source of truth.
2. **Derived data.** Review findings, dashboards, computed reports, point-in-time projections live as views in the System of Insight (over UDM). They are not materialized into SoE tables; the application reads them via federation (Trino, Postgres FDW) or refreshes a thin local cache.

---

## Contract with UDM

The SoE references UDM entities by opaque string ID. Foreign-key constraints do not cross the layer boundary. Application-layer cleanup handles orphan references when a UDM entity is deleted.

Data movement:

- **Inbound (SoE to SoR).** Finalized application data flows from SoE to UDM via ETL or streaming change-data-capture (e.g., Debezium reading the SoE's transaction log). The SoE is the staging ground for transient state; the SoR is the canonical store of finalized data.
- **Outbound (SoR to SoE).** The SoE reads UDM data through a federation layer (Trino, Postgres FDW) or maintains a thin local cache. The SoE does not "own" any UDM data; reads are always against the canonical store.
- **No SoE-to-SoE replication is assumed.** Each application instance has its own SoE; cross-instance state coordination is an institutional choice (shared session store, message broker, etc.) and not a UDM concern.

---

## Sample shapes

These shapes are illustrative. Adopters define their own SoE entities based on application architecture. Naming, column types, and identifiers are conventional.

### Sample 1: User and authentication

A user account, with login credentials and application-role assignment. The `personnel_id` field is an opaque reference to a `Personnel` row in UDM. No FK constraint across layers; the application enforces the mapping.

```
TABLE user
  user_id              uuid PRIMARY KEY
  username             text UNIQUE
  email                text UNIQUE
  hashed_password      text
  personnel_id         text NULL                -- opaque ref to UDM Personnel.Personnel_ID
  application_role     text                     -- e.g., 'pi' / 'osp_admin' / 'reviewer' / 'system_admin'
  is_active            boolean
  created_at           timestamptz
  last_login_at        timestamptz NULL
```

### Sample 2: Session and token blacklist

Active session metadata and revoked-token list for JWT-based auth.

```
TABLE session
  session_id           uuid PRIMARY KEY
  user_id              uuid REFERENCES user(user_id)
  started_at           timestamptz
  last_active_at       timestamptz
  expires_at           timestamptz
  ip_address           inet
  user_agent           text

TABLE token_blacklist
  jti                  text PRIMARY KEY        -- JWT identifier
  expires_at           timestamptz             -- when the token would have expired naturally
  revoked_at           timestamptz
  revoked_by_user_id   uuid REFERENCES user(user_id) NULL
```

### Sample 3: AI configuration

LLM endpoint registrations and workflow-to-endpoint mappings. These are application infrastructure, not UDM data.

```
TABLE llm_endpoint
  endpoint_id          uuid PRIMARY KEY
  name                 text
  endpoint_url         text
  api_key_env_var      text NULL
  model_name           text
  provider_type        text                     -- e.g., 'openai_compatible' / 'anthropic'
  endpoint_kind        text                     -- 'llm' / 'ocr' / 'extraction'
  is_active            boolean

TABLE ai_workflow_mapping
  mapping_id           uuid PRIMARY KEY
  workflow_task        text UNIQUE              -- e.g., 'rfa_analysis' / 'content_review'
  endpoint_id          uuid REFERENCES llm_endpoint(endpoint_id) NULL
  prompt_version       text NULL
  budget_monthly_usd   numeric(10,2) NULL
```

### Sample 4: In-flight wizard drafts

Partial form data being held while a user fills out a multi-step form. On submission, the application materializes the data into UDM via the appropriate entity (e.g., a `Proposal` row); the draft is then archived or deleted.

```
TABLE wizard_draft
  draft_id             uuid PRIMARY KEY
  user_id              uuid REFERENCES user(user_id)
  draft_type           text                     -- e.g., 'proposal' / 'protocol_amendment' / 'policy_exception'
  payload              jsonb                    -- serialized form state
  target_entity_type   text NULL                -- if editing an existing UDM entity, the UDM table name
  target_entity_id     text NULL                -- if editing an existing UDM entity, the UDM PK
  created_at           timestamptz
  updated_at           timestamptz
  status               text                     -- 'in_progress' / 'submitted' / 'abandoned'
  submitted_at         timestamptz NULL
```

The `payload` JSON is application-specific. On submission, the application validates, transforms, and writes the finalized data to UDM via the inbound data-movement path (ETL or streaming). The draft row is retained briefly for recovery and undo, then purged per institutional retention policy.

### Sample 5: Application configuration and feature flags

Per-environment configuration that an institution may want to change without a code deployment.

```
TABLE feature_flag
  flag_id              uuid PRIMARY KEY
  flag_key             text UNIQUE              -- e.g., 'enable_ai_content_review'
  enabled              boolean
  scope                text                     -- 'global' / 'institution' / 'user_role'
  scope_value          text NULL
  updated_at           timestamptz
  updated_by_user_id   uuid REFERENCES user(user_id) NULL

TABLE institution_config
  config_id            uuid PRIMARY KEY
  config_key           text UNIQUE              -- e.g., 'banner_integration_url' / 'sponsor_csv_import_schedule'
  config_value         text
  is_secret            boolean                  -- if true, value is stored elsewhere; this row tracks metadata only
  updated_at           timestamptz
```

### Sample 6: Observability events (operator actions)

Application-level events that are not row changes to UDM data. Things like "user viewed proposal", "user marked a finding for follow-up", "user generated a report". These are telemetry, not source-of-truth.

```
TABLE operator_action
  action_id            uuid PRIMARY KEY
  user_id              uuid REFERENCES user(user_id)
  action_type          text                     -- e.g., 'view' / 'export' / 'mark_for_review' / 'send_email'
  subject_type         text NULL                -- the UDM table the action relates to, when applicable
  subject_id           text NULL                -- the UDM PK the action relates to
  occurred_at          timestamptz
  details              jsonb NULL               -- action-specific structured detail
  ip_address           inet NULL
  session_id           uuid NULL
```

This table captures what was formerly the `operator_action` use case of UDM's deprecated `ActivityLog`. Observability and telemetry live in the SoE, not in UDM.

---

## Notes

- Naming conventions for SoE tables typically follow the host application's conventions (snake_case in PostgreSQL is common). The PascalCase-with-underscores convention used by UDM is not required at this layer because cross-institution interoperability of SoE schemas is rarely a goal.
- The SoE is institutionally specific. Two adopter institutions running the same UDM data may have radically different SoE designs because their applications, auth providers, and operational tooling differ.
- The SoE may itself use its own audit-trail mechanism (Postgres temporal tables, dedicated audit tables) for its own non-UDM data. The shape can conform to the "Audit record shape" pattern documented in `vignettes/udm-v2-patterns.md` for portability with the SoR-side audit data, or it may follow a different shape if institutional needs differ.
- Anything in this document that an adopter promotes to source-of-truth research-admin data should be moved to UDM proper. Conversely, anything in UDM that turns out to be application infrastructure (the prior `ActivityLog` operator_action case is the canonical example) should be moved here.
- The SoE specification is not part of the UDM versioned spec. SoE shapes evolve with application stacks and do not need to track UDM version numbers.
