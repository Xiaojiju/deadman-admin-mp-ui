export function getStatusText(status) {
  if (status === 1) return '正常';
  if (status === 0) return '禁用';
  return '-';
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
