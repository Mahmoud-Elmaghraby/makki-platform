import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/apiClient";
import type { CheckpointAnswerResult, CheckpointForViewer } from "../types/api";

// بترجع أسئلة الفيديو مرتبة — بيتصفوا حسب التوقيت في المكوّن نفسه
// (VideoPlayer) عشان نقارنهم بـ currentTime بسهولة.
export function useLessonCheckpoints(lessonId: string | null) {
  return useQuery({
    queryKey: ["student", "checkpoints", lessonId],
    queryFn: async () => {
      const { data } = await apiClient.get<CheckpointForViewer[]>(
        `/lessons/${lessonId}/checkpoints`,
      );
      return data;
    },
    enabled: !!lessonId,
  });
}

export function useAnswerCheckpoint(lessonId: string | null) {
  return useMutation({
    mutationFn: async ({
      checkpointId,
      selectedOptionId,
      booleanAnswer,
    }: {
      checkpointId: string;
      selectedOptionId?: string;
      booleanAnswer?: boolean;
    }) => {
      const { data } = await apiClient.post<CheckpointAnswerResult>(
        `/lessons/${lessonId}/checkpoints/${checkpointId}/answer`,
        { selectedOptionId, booleanAnswer },
      );
      return data;
    },
  });
}
