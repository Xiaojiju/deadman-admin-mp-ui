/** 初始化字段错误对象 */
export function createFieldErrors(fields) {
  return Object.fromEntries(fields.map((field) => [field, '']));
}

/** 文本输入 patch，输入时清除对应字段错误 */
export function inputPatch(data, field, value) {
  const patch = { [field]: value };
  if (data.fieldErrors?.[field]) {
    patch[`fieldErrors.${field}`] = '';
  }
  return patch;
}

/** 合并多项校验结果 */
export function mergeValidation(errors, checks) {
  let valid = true;
  const next = { ...errors };
  checks.forEach(({ field, message, ok }) => {
    if (!ok) {
      next[field] = message;
      valid = false;
    } else {
      next[field] = '';
    }
  });
  return { valid, errors: next };
}

/** 表单创建/编辑权限校验 */
export function assertFormPerm(isEdit, perms, toastFn) {
  if (isEdit && !perms.update) {
    toastFn('无编辑权限');
    return false;
  }
  if (!isEdit && !perms.create) {
    toastFn('无创建权限');
    return false;
  }
  return true;
}
