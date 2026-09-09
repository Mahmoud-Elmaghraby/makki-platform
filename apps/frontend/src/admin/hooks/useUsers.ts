import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Role, StaffUser } from "../types/api";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  bio?: string;
  photoUrl?: string;
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  password?: string;
  bio?: string;
  photoUrl?: string;
}

export function useUsers() {
  return useQuery({
    queryKey: ["users", "admin"],
    queryFn: async () => {
      const { data } = await apiClient.get<StaffUser[]>("/admin/users");
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      const { data } = await apiClient.post<StaffUser>("/admin/users", input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "admin"] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateUserInput) => {
      const { data } = await apiClient.patch<StaffUser>(`/admin/users/${id}`, input);
      return data;
    },
    // لو المستخدم ده مدرب، اسمه بيتحدّث كمان في صف Instructor المرتبط —
    // واسم المدرب متضمّن (embedded) جوه رد الكورسات نفسه، فلازم نبطل كاش
    // الكورسات كمان وإلا تفضل شايلة الاسم القديم.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["instructors"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "admin"] }),
  });
}
