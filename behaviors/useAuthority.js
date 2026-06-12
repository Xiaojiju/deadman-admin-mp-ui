import { PermissionCode } from '~/constants/permissions';
import { ensureLoggedIn } from '~/utils/auth';
import { fetchUserAuthority, hasPermission } from '~/utils/permission';

const useAuthorityBehavior = Behavior({
  data: {
    authority: null,
    perms: {},
  },

  methods: {
    async initAuthority() {
      if (!ensureLoggedIn()) return null;
      const authority = await fetchUserAuthority();
      this.setData({ authority });
      return authority;
    },

    setPermFlags(flagMap) {
      const { authority } = this.data;
      const perms = {};
      Object.entries(flagMap).forEach(([key, code]) => {
        perms[key] = hasPermission(authority, code);
      });
      this.setData({ perms });
    },

    can(code) {
      return hasPermission(this.data.authority, code);
    },
  },
});

export { PermissionCode };
export default useAuthorityBehavior;
