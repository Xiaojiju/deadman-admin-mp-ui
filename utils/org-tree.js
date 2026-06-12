import { flattenDepartmentTree } from '~/utils/admin';

/** 部门树扁平化，用于选择器展示 */
export function flattenDepartments(nodes, level = 0) {
  return flattenDepartmentTree(nodes, level).map((item) => ({
    id: item.id,
    name: item.deptName,
    level: item.level,
    selected: false,
  }));
}
