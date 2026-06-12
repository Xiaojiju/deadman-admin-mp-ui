import { PermissionCode } from '~/constants/permissions';

/** 工作台功能入口（按后台菜单结构） */
export const WORKSPACE_SECTIONS = [
  {
    title: '组织',
    items: [
      {
        type: 'department',
        label: '部门',
        icon: 'city',
        permission: PermissionCode.DEPT_LIST_READ,
      },
      {
        type: 'position',
        label: '职位',
        icon: 'work',
        permission: PermissionCode.POSITION_LIST_READ,
      },
    ],
  },
  {
    title: '系统',
    items: [
      {
        type: 'user',
        label: '用户',
        icon: 'user',
        permission: PermissionCode.USER_LIST_READ,
      },
      {
        type: 'role',
        label: '角色',
        icon: 'usergroup',
        permission: PermissionCode.ROLE_LIST_READ,
      },
      {
        type: 'permission',
        label: '权限',
        icon: 'secured',
        permission: PermissionCode.AUTH_PERMISSIONS_READ,
      },
    ],
  },
];
