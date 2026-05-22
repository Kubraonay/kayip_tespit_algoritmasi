"use server";

/** @deprecated Yetki yönetimi için lib/actions/rbac.ts kullanın */
export {
  getUsersForManagement as getUsersList,
  createUser as createUserByAdmin,
  updateUserRole,
  deleteUser,
} from "@/lib/actions/rbac";
