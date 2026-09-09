import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { Checkpoint, CheckpointOption, CheckpointQuestionType } from "../types/api";

export interface CheckpointInput {
  timestampSeconds: number;
  question: string;
  type: CheckpointQuestionType;
  order?: number;
  options?: CheckpointOption[];
  correctOptionId?: string;
  correctBoolean?: boolean;
}

function checkpointsKey(courseId: string | undefined, lessonId: string | undefined) {
  return ["checkpoints", courseId, lessonId];
}

export function useCheckpoints(courseId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: checkpointsKey(courseId, lessonId),
    queryFn: async () => {
      const { data } = await apiClient.get<Checkpoint[]>(
        `/courses/${courseId}/lessons/${lessonId}/checkpoints`,
      );
      return data;
    },
    enabled: !!courseId && !!lessonId,
  });
}

export function useAddCheckpoint(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckpointInput) => {
      const { data } = await apiClient.post<Checkpoint>(
        `/courses/${courseId}/lessons/${lessonId}/checkpoints`,
        input,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: checkpointsKey(courseId, lessonId) }),
  });
}

export function useUpdateCheckpoint(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CheckpointInput>) => {
      const { data } = await apiClient.patch<Checkpoint>(
        `/courses/${courseId}/lessons/${lessonId}/checkpoints/${id}`,
        input,
      );
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: checkpointsKey(courseId, lessonId) }),
  });
}

export function useDeleteCheckpoint(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/courses/${courseId}/lessons/${lessonId}/checkpoints/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: checkpointsKey(courseId, lessonId) }),
  });
}
