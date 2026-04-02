export const ROLE_TYPES = [
  "boss",
  "operations_director",
  "product_rnd_director",
  "visual_director",
];

const roleProfiles = {
  boss: {
    roleId: "boss",
    roleType: "boss",
    roleName: "老板",
    goalFocus: "聚焦最值得继续投入、需要拍板和可复制的经营机会。",
    primaryObjects: ["project", "decision", "risk", "asset"],
    decisionScope: ["预算", "价格", "继续投入/暂停", "复盘沉淀优先级"],
    evidencePreference: ["ROI", "风险摘要", "审批项", "复盘资产"],
    actionScope: ["审批拍板", "资源取舍", "升级关键决策"],
    summaryStyle: "exception-first",
  },
  operations_director: {
    roleId: "operations_director",
    roleType: "operations_director",
    roleName: "运营与营销总监",
    directorArchetype: "operations",
    goalFocus: "推动项目推进、处理经营异常、组织协同动作落地。",
    primaryObjects: ["project", "decision", "action", "risk"],
    decisionScope: ["推进策略", "预算重配建议", "跨团队协同", "升级给老板的决策"],
    evidencePreference: ["KPI 异常", "项目卡点", "推荐动作", "风险/机会"],
    actionScope: ["推进", "协调", "升级", "跟进"],
    summaryStyle: "action-oriented",
  },
  product_rnd_director: {
    roleId: "product_rnd_director",
    roleType: "product_rnd_director",
    roleName: "产品研发总监",
    directorArchetype: "product_rnd",
    goalFocus: "识别值得推进的商品方向，明确定义，推动打样与首发验证。",
    primaryObjects: ["project", "opportunity", "decision", "knowledge"],
    decisionScope: ["商品定义", "新品推进", "打样/验证优先级", "经验沉淀复用"],
    evidencePreference: ["商机输入", "定义缺口", "验证结果", "SOP/规则"],
    actionScope: ["定义澄清", "打样推进", "验证立项", "经验沉淀"],
    summaryStyle: "opportunity-led",
  },
  visual_director: {
    roleId: "visual_director",
    roleType: "visual_director",
    roleName: "视觉总监",
    directorArchetype: "visual",
    goalFocus: "优先支持需要表达优化的项目，推动创意迭代和模板沉淀。",
    primaryObjects: ["project", "decision", "knowledge", "asset"],
    decisionScope: ["视觉支持优先级", "创意迭代方向", "模板复用"],
    evidencePreference: ["CTR/CVR 关系", "表达问题", "模板经验", "视觉相关动作"],
    actionScope: ["表达优化", "素材迭代", "模板沉淀"],
    summaryStyle: "expression-first",
  },
};

export function normalizeRoleType(role) {
  if (!role) {
    return null;
  }

  if (role === "director") {
    return "operations_director";
  }

  if (role in roleProfiles) {
    return role;
  }

  return null;
}

export function getRoleProfile(role) {
  const normalized = normalizeRoleType(role);
  if (!normalized) {
    return null;
  }
  return roleProfiles[normalized];
}

export function listRoleProfiles() {
  return Object.values(roleProfiles);
}
