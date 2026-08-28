import { api } from "./apiClient";

const BASE = "/api/admin/moderation";

/**
 * Converts page-based pagination (1-indexed) to skip/limit for the backend.
 * All other params are passed through as-is.
 */
function toSkip({ page = 1, limit = 10, ...rest } = {}) {
  return { skip: (page - 1) * limit, limit, ...rest };
}

export const moderationService = {
  // ─── Overview ─────────────────────────────────────────────────────────────
  /** Full moderation state for a single user */
  getUserOverview: (userId) => api.get(`${BASE}/overview/${userId}`),

  // ─── Violations ───────────────────────────────────────────────────────────
  /**
   * Get paginated violations list.
   * @param {{ page?, limit?, userId?, targetRole?, violationType?, source?,
   *           severity?, status?, startDate?, endDate?, search? }} params
   */
  getViolations: (params = {}) => api.get(`${BASE}/violations`, toSkip(params)),

  /** Get a single violation by ID */
  getViolationById: (id) => api.get(`${BASE}/violations/${id}`),

  /**
   * Record a manual violation (triggers automated rule engine).
   * @param {{ userId, targetRole, violationType, source, severity,
   *           description, sourceType?, sourceId?, metadata? }} data
   */
  createViolation: (data) => api.post(`${BASE}/violations`, data),

  // ─── Penalties ────────────────────────────────────────────────────────────
  /**
   * Get paginated penalties list.
   * @param {{ page?, limit?, userId?, targetRole?, penaltyType?,
   *           status?, issuedByType?, startDate?, endDate? }} params
   */
  getPenalties: (params = {}) => api.get(`${BASE}/penalties`, toSkip(params)),

  /** Get a single penalty with its associated restrictions */
  getPenaltyById: (id) => api.get(`${BASE}/penalties/${id}`),

  /**
   * Issue a manual penalty.
   * @param {{ userId, targetRole, penaltyType, severity, reason,
   *           durationMinutes?, restrictionTypes?, violationIds?, metadata? }} data
   */
  issuePenalty: (data) => api.post(`${BASE}/penalties`, data),

  /**
   * Revoke an active penalty (auto-lifts all associated restrictions).
   * @param {number} id - penalty ID
   * @param {{ reason: string }} data
   */
  revokePenalty: (id, data) => api.post(`${BASE}/penalties/${id}/revoke`, data),

  // ─── Restrictions ─────────────────────────────────────────────────────────
  /**
   * Get paginated restrictions list.
   * @param {{ page?, limit?, userId?, restrictionType?, status?, activeOnly? }} params
   */
  getRestrictions: (params = {}) =>
    api.get(`${BASE}/restrictions`, toSkip(params)),

  /**
   * Revoke a single restriction without revoking the parent penalty.
   * @param {number} id - restriction ID
   * @param {{ reason: string }} data
   */
  revokeRestriction: (id, data) =>
    api.post(`${BASE}/restrictions/${id}/revoke`, data),

  // ─── Appeals ──────────────────────────────────────────────────────────────
  /**
   * Get paginated appeals list.
   * @param {{ page?, limit?, userId?, penaltyId?, status? }} params
   */
  getAppeals: (params = {}) => api.get(`${BASE}/appeals`, toSkip(params)),

  /** Get full appeal details (including confidential adminNotes) */
  getAppealById: (id) => api.get(`${BASE}/appeals/${id}`),

  /**
   * Start reviewing an appeal (assigns to requesting admin, sets UNDER_REVIEW).
   * No request body required.
   */
  reviewAppeal: (id) => api.patch(`${BASE}/appeals/${id}/review`),

  /**
   * Approve an appeal (auto-revokes associated penalty + restrictions).
   * @param {number} id
   * @param {{ adminDecision: string, adminNotes?: string }} data
   */
  approveAppeal: (id, data) => api.post(`${BASE}/appeals/${id}/approve`, data),

  /**
   * Reject an appeal (penalty remains ACTIVE).
   * @param {number} id
   * @param {{ adminDecision: string, adminNotes?: string }} data
   */
  rejectAppeal: (id, data) => api.post(`${BASE}/appeals/${id}/reject`, data),

  // ─── Automated Penalty Rules ───────────────────────────────────────────────
  /** Get all automated penalty rules */
  getRules: () => api.get(`${BASE}/rules`),

  /** Get a single rule by ID */
  getRuleById: (id) => api.get(`${BASE}/rules/${id}`),

  /**
   * Create a new automated rule.
   * @param {{ name, description, violationType, targetRole, thresholdCount,
   *           windowMinutes, penaltyType, severity, durationMinutes?,
   *           restrictionTypes, priority, isActive }} data
   */
  createRule: (data) => api.post(`${BASE}/rules`, data),

  /**
   * Update an existing rule.
   * @param {number} id
   * @param {Partial<RuleData>} data
   */
  updateRule: (id, data) => api.patch(`${BASE}/rules/${id}`, data),

  /**
   * Soft-deactivate a rule (sets isActive = false, not a hard delete).
   * @param {number} id
   */
  deleteRule: (id) => api.del(`${BASE}/rules/${id}`),

  // ─── Audit Logs ───────────────────────────────────────────────────────────
  /**
   * Get paginated immutable audit log.
   * @param {{ page?, limit?, targetUserId?, actorType?, action?,
   *           entityType?, startDate?, endDate? }} params
   */
  getAuditLogs: (params = {}) =>
    api.get(`${BASE}/audit-logs`, toSkip(params)),
};
