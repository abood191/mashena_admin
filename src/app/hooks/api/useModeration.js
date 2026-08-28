import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { moderationService } from "../../services/moderation.service";

/* ─── Query Key Factory ──────────────────────────────────────────────────── */
export const moderationKeys = {
  all: ["moderation"],

  overview: (userId) => ["moderation", "overview", userId],

  violations: () => ["moderation", "violations"],
  violationList: (filters) => ["moderation", "violations", "list", { filters }],
  violation: (id) => ["moderation", "violations", "detail", id],

  penalties: () => ["moderation", "penalties"],
  penaltyList: (filters) => ["moderation", "penalties", "list", { filters }],
  penalty: (id) => ["moderation", "penalties", "detail", id],

  restrictions: () => ["moderation", "restrictions"],
  restrictionList: (filters) => [
    "moderation",
    "restrictions",
    "list",
    { filters },
  ],

  appeals: () => ["moderation", "appeals"],
  appealList: (filters) => ["moderation", "appeals", "list", { filters }],
  appeal: (id) => ["moderation", "appeals", "detail", id],

  rules: () => ["moderation", "rules"],
  rule: (id) => ["moderation", "rules", "detail", id],

  auditLogs: (filters) => ["moderation", "audit-logs", { filters }],
};

/* ═══════════════════════════════════════════════════════════════════════════
   OVERVIEW
═══════════════════════════════════════════════════════════════════════════ */

/** Full moderation state for a single user (status, warnings, violations, penalties, restrictions, appeals) */
export const useUserModerationOverview = (userId, options = {}) =>
  useQuery({
    queryKey: moderationKeys.overview(userId),
    queryFn: () => moderationService.getUserOverview(userId),
    enabled: !!userId,
    staleTime: 30_000,
    ...options,
  });

/* ═══════════════════════════════════════════════════════════════════════════
   VIOLATIONS — Queries
═══════════════════════════════════════════════════════════════════════════ */

/** Paginated violations list with optional filters */
export const useViolations = (filters = {}, options = {}) =>
  useQuery({
    queryKey: moderationKeys.violationList(filters),
    queryFn: () => moderationService.getViolations(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/** Single violation detail */
export const useViolationById = (id, options = {}) =>
  useQuery({
    queryKey: moderationKeys.violation(id),
    queryFn: () => moderationService.getViolationById(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });

/* ─── VIOLATIONS — Mutations ─────────────────────────────────────────────── */

/**
 * Record a manual violation.
 * Invalidates: violations list + overview for the targeted user.
 * Note: API may auto-issue a penalty via the rule engine (returned as penaltyId).
 */
export const useCreateViolation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => moderationService.createViolation(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: moderationKeys.violations() });
      qc.invalidateQueries({ queryKey: moderationKeys.penalties() });
      if (variables?.userId) {
        qc.invalidateQueries({
          queryKey: moderationKeys.overview(variables.userId),
        });
      }
    },
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
   PENALTIES — Queries
═══════════════════════════════════════════════════════════════════════════ */

/** Paginated penalties list with optional filters */
export const usePenalties = (filters = {}, options = {}) =>
  useQuery({
    queryKey: moderationKeys.penaltyList(filters),
    queryFn: () => moderationService.getPenalties(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/** Single penalty with associated restrictions */
export const usePenaltyById = (id, options = {}) =>
  useQuery({
    queryKey: moderationKeys.penalty(id),
    queryFn: () => moderationService.getPenaltyById(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });

/* ─── PENALTIES — Mutations ──────────────────────────────────────────────── */

/**
 * Issue a manual penalty.
 * Invalidates: penalties + violations (rule engine may link them) + overview.
 */
export const useIssuePenalty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => moderationService.issuePenalty(data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: moderationKeys.penalties() });
      qc.invalidateQueries({ queryKey: moderationKeys.violations() });
      if (variables?.userId) {
        qc.invalidateQueries({
          queryKey: moderationKeys.overview(variables.userId),
        });
      }
    },
  });
};

/**
 * Revoke a penalty.
 * Cascade: API auto-lifts all associated restrictions.
 * Invalidates: specific penalty detail + all restrictions + overview.
 */
export const useRevokePenalty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => moderationService.revokePenalty(id, data),
    onSuccess: (result, { id }) => {
      qc.invalidateQueries({ queryKey: moderationKeys.penalty(id) });
      qc.invalidateQueries({ queryKey: moderationKeys.penalties() });
      qc.invalidateQueries({ queryKey: moderationKeys.restrictions() });
      if (result?.userId) {
        qc.invalidateQueries({
          queryKey: moderationKeys.overview(result.userId),
        });
      }
    },
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
   RESTRICTIONS — Queries
═══════════════════════════════════════════════════════════════════════════ */

/** Paginated restrictions list with optional filters */
export const useRestrictions = (filters = {}, options = {}) =>
  useQuery({
    queryKey: moderationKeys.restrictionList(filters),
    queryFn: () => moderationService.getRestrictions(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/* ─── RESTRICTIONS — Mutations ───────────────────────────────────────────── */

/**
 * Revoke a single restriction (without revoking the parent penalty).
 * Invalidates: restrictions + parent penalty (status may update) + overview.
 */
export const useRevokeRestriction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => moderationService.revokeRestriction(id, data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: moderationKeys.restrictions() });
      qc.invalidateQueries({ queryKey: moderationKeys.penalties() });
      if (result?.userId) {
        qc.invalidateQueries({
          queryKey: moderationKeys.overview(result.userId),
        });
      }
    },
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
   APPEALS — Queries
═══════════════════════════════════════════════════════════════════════════ */

/** Paginated appeals list with optional filters */
export const useAppeals = (filters = {}, options = {}) =>
  useQuery({
    queryKey: moderationKeys.appealList(filters),
    queryFn: () => moderationService.getAppeals(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });

/** Single appeal full details (includes confidential adminNotes) */
export const useAppealById = (id, options = {}) =>
  useQuery({
    queryKey: moderationKeys.appeal(id),
    queryFn: () => moderationService.getAppealById(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });

/* ─── APPEALS — Mutations ────────────────────────────────────────────────── */

/** Assign appeal to admin and set status to UNDER_REVIEW */
export const useReviewAppeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => moderationService.reviewAppeal(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: moderationKeys.appeal(id) });
      qc.invalidateQueries({ queryKey: moderationKeys.appeals() });
    },
  });
};

/**
 * Approve an appeal.
 * Cascade: API auto-revokes associated penalty + all its restrictions.
 * Invalidates: appeals + penalties + restrictions + overview.
 */
export const useApproveAppeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => moderationService.approveAppeal(id, data),
    onSuccess: (result, { id }) => {
      qc.invalidateQueries({ queryKey: moderationKeys.appeal(id) });
      qc.invalidateQueries({ queryKey: moderationKeys.appeals() });
      qc.invalidateQueries({ queryKey: moderationKeys.penalties() });
      qc.invalidateQueries({ queryKey: moderationKeys.restrictions() });
      if (result?.userId) {
        qc.invalidateQueries({
          queryKey: moderationKeys.overview(result.userId),
        });
      }
    },
  });
};

/**
 * Reject an appeal (penalty remains ACTIVE).
 * Invalidates: specific appeal + appeals list.
 */
export const useRejectAppeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => moderationService.rejectAppeal(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: moderationKeys.appeal(id) });
      qc.invalidateQueries({ queryKey: moderationKeys.appeals() });
    },
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
   AUTOMATED PENALTY RULES — Queries
═══════════════════════════════════════════════════════════════════════════ */

/** All automated penalty rules */
export const useModerationRules = (options = {}) =>
  useQuery({
    queryKey: moderationKeys.rules(),
    queryFn: () => moderationService.getRules(),
    staleTime: 60_000,
    ...options,
  });

/** Single rule by ID */
export const useModerationRuleById = (id, options = {}) =>
  useQuery({
    queryKey: moderationKeys.rule(id),
    queryFn: () => moderationService.getRuleById(id),
    enabled: !!id,
    staleTime: 60_000,
    ...options,
  });

/* ─── RULES — Mutations ──────────────────────────────────────────────────── */

/** Create a new automated penalty rule */
export const useCreateModerationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => moderationService.createRule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: moderationKeys.rules() }),
  });
};

/** Update an existing automated penalty rule */
export const useUpdateModerationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => moderationService.updateRule(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: moderationKeys.rule(id) });
      qc.invalidateQueries({ queryKey: moderationKeys.rules() });
    },
  });
};

/**
 * Soft-deactivate a rule (isActive = false, not hard delete).
 * Invalidates: rules list.
 */
export const useDeleteModerationRule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => moderationService.deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: moderationKeys.rules() }),
  });
};

/* ═══════════════════════════════════════════════════════════════════════════
   AUDIT LOGS — Query only (read-only)
═══════════════════════════════════════════════════════════════════════════ */

/** Immutable audit trail with filters */
export const useAuditLogs = (filters = {}, options = {}) =>
  useQuery({
    queryKey: moderationKeys.auditLogs(filters),
    queryFn: () => moderationService.getAuditLogs(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });
