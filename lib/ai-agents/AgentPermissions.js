import { AgentPermissionLevel, permissionAllows } from './contracts.js';

const BLOCKED_ACTIONS = new Set([
  'delete_production_data',
  'modify_credentials',
  'touch_real_payments',
  'send_bulk_external_messages',
  'publish_external_content',
  'manual_price_override_without_source',
  'manipulate_user_data_without_audit',
  'execute_untrusted_remote_code',
]);

export class AgentPermissions {
  constructor({ autonomyLevel = AgentPermissionLevel.LEVEL_0_READ_ONLY, environment = 'local', productionApproval = false, allowLevel4 = false } = {}) {
    this.autonomyLevel = autonomyLevel;
    this.environment = environment;
    this.productionApproval = productionApproval;
    this.allowLevel4 = allowLevel4;
  }

  canRun(agent) {
    if ((this.autonomyLevel === AgentPermissionLevel.LEVEL_4_CONTROLLED_EXECUTION || agent.permissionLevel === AgentPermissionLevel.LEVEL_4_CONTROLLED_EXECUTION) && !this.allowLevel4) {
      return { ok: false, reason: 'level_4_requires_explicit_override' };
    }
    if (this.environment === 'production' && !this.productionApproval && agent.permissionLevel !== AgentPermissionLevel.LEVEL_0_READ_ONLY) {
      return { ok: false, reason: 'production_requires_explicit_approval' };
    }
    if (!permissionAllows(this.autonomyLevel, agent.permissionLevel)) {
      return { ok: false, reason: `requires_${agent.permissionLevel}` };
    }
    return { ok: true };
  }

  canExecuteAction(action) {
    if (BLOCKED_ACTIONS.has(action.type)) {
      return { ok: false, reason: `blocked_action_${action.type}` };
    }
    if (action.risk === 'high' || action.risk === 'critical') {
      return { ok: false, reason: 'high_risk_requires_human_review' };
    }
    return { ok: true };
  }
}
