export function getStatusText(status) {
  if (status === 1) return '正常';
  if (status === 0) return '禁用';
  return '-';
}

export const STATUS_PICKER_OPTIONS = [
  { label: '正常', value: 1 },
  { label: '禁用', value: 0 },
];

/** dataset 中 boolean 常为字符串 */
export function isDatasetTruthy(value) {
  return value === true || value === 'true';
}

/** 系统管理员用户不可删除 */
export function isSystemAdminUser(user) {
  if (!user) return false;
  return !!(user.superAdmin || user.systemAdmin);
}

/** picker 选项 value 统一为字符串，避免雪花 ID 经 Number 转换丢精度 */
export function normalizePickerId(value) {
  if (value === '' || value === null || value === undefined) return '';
  return String(value);
}

function mapDepartmentRow(node, level, hasChildren, expanded) {
  return {
    id: node.id,
    parentId: node.parentId,
    deptCode: node.deptCode,
    deptName: node.deptName,
    sortOrder: node.sortOrder,
    status: node.status,
    level,
    hasChildren,
    expanded,
    statusText: getStatusText(node.status),
  };
}

export function confirmAdminDelete({ title, name, onConfirm }) {
  wx.showModal({
    title,
    content: `确定删除「${name}」吗？`,
    confirmColor: '#e34d59',
    success: (res) => {
      if (res.confirm) onConfirm();
    },
  });
}

/** 按展开状态生成可见部门行（默认仅显示根节点） */
export function buildDepartmentVisibleList(nodes, expandedIds = [], level = 0) {
  const expandedSet = new Set((expandedIds || []).map((id) => String(id)));
  const result = [];
  (nodes || []).forEach((node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const expanded = expandedSet.has(String(node.id));
    result.push(mapDepartmentRow(node, level, hasChildren, expanded));
    if (hasChildren && expanded) {
      result.push(...buildDepartmentVisibleList(node.children, expandedIds, level + 1));
    }
  });
  return result;
}

/** 搜索时保留层级并自动展开匹配分支 */
export function buildDepartmentSearchList(nodes, keyword, level = 0) {
  const kw = (keyword || '').trim().toLowerCase();
  if (!kw) return [];
  const result = [];
  (nodes || []).forEach((node) => {
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const selfMatch =
      String(node.deptName || '').toLowerCase().includes(kw) ||
      String(node.deptCode || '').toLowerCase().includes(kw);
    const childRows = hasChildren ? buildDepartmentSearchList(node.children, keyword, level + 1) : [];
    const childMatch = childRows.length > 0;
    if (selfMatch || childMatch) {
      result.push(mapDepartmentRow(node, level, hasChildren, childMatch));
      if (childRows.length) result.push(...childRows);
    }
  });
  return result;
}

export function flattenDepartmentTree(nodes, level = 0) {
  const result = [];
  (nodes || []).forEach((node) => {
    result.push({
      id: node.id,
      parentId: node.parentId,
      deptCode: node.deptCode,
      deptName: node.deptName,
      sortOrder: node.sortOrder,
      status: node.status,
      level,
      indent: level > 0 ? `${'　'.repeat(level)}` : '',
      statusText: getStatusText(node.status),
    });
    if (Array.isArray(node.children) && node.children.length) {
      result.push(...flattenDepartmentTree(node.children, level + 1));
    }
  });
  return result;
}

export function filterByKeyword(list, keyword, fields) {
  const kw = (keyword || '').trim().toLowerCase();
  if (!kw) return list;
  return list.filter((item) =>
    fields.some((field) => String(item[field] || '').toLowerCase().includes(kw)),
  );
}

/** 扁平部门树 → picker 选项 */
export function buildFlatDepartmentPickerOptions(flat, { emptyLabel, emptyValue = '' } = {}) {
  const options = (flat || []).map((item) => ({
    label: `${item.indent}${item.deptName}`,
    value: item.id,
  }));
  if (emptyLabel !== undefined) {
    return [{ label: emptyLabel, value: emptyValue }, ...options];
  }
  return options;
}

/** 角色列表项（用户表单 / 角色分配页共用） */
export function mapRoleListItems(items, selectedIdSet) {
  return (items || []).map((item) => ({
    id: String(item.id),
    roleCode: item.roleCode,
    roleName: item.roleName,
    description: item.description || '暂无描述',
    status: item.status,
    statusText: getStatusText(item.status),
    selected: selectedIdSet ? selectedIdSet.has(String(item.id)) : false,
  }));
}
