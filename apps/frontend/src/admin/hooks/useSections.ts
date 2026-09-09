import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Section } from "../types/api";

export function useSections(courseId: string | undefined) {
  return useQuery({
    queryKey: ["sections", courseId],
    queryFn: async () => {
      const { data } = await apiClient.get<Section[]>(`/courses/${courseId}/sections`);
      return data;
    },
    enabled: !!courseId,
  });
}

export function useCreateSection(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; order?: number; parentId?: string }) => {
      const { data } = await apiClient.post<Section>(`/courses/${courseId}/sections`, input);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", courseId] }),
  });
}

export function useUpdateSection(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string; title?: string; order?: number; parentId?: string }) => {
      const { data } = await apiClient.patch<Section>(
        `/courses/${courseId}/sections/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", courseId] }),
  });
}

export function useDeleteSection(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${courseId}/sections/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections", courseId] }),
  });
}
