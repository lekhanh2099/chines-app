"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCustomHanziHomeCourse,
  getCustomHanziHomeCourseCatalog,
} from "@/features/hanzihome/courses/custom-course-api";
import type { CreateHanziHomeCourseRequest } from "@/features/hanzihome/courses/course.schema";

export const hanzihomeCourseQueryKeys = {
  all: ["hanzihome", "courses"] as const,
  catalog: () => [...hanzihomeCourseQueryKeys.all, "catalog"] as const,
};

export function useCustomHanziHomeCourseCatalogQuery() {
  return useQuery({
    queryKey: hanzihomeCourseQueryKeys.catalog(),
    queryFn: getCustomHanziHomeCourseCatalog,
  });
}

export function useCreateCustomHanziHomeCourseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHanziHomeCourseRequest) =>
      createCustomHanziHomeCourse(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: hanzihomeCourseQueryKeys.catalog(),
      });
    },
  });
}
