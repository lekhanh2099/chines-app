"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCustomHanziHomeCourse,
  createCustomHanziHomeCourseBook,
  forkSeedHanziHomeCourse,
  getCustomHanziHomeCourseCatalog,
} from "@/features/hanzihome/courses/custom-course-api";
import type {
  CreateHanziHomeCourseBookRequest,
  CreateHanziHomeCourseRequest,
} from "@/features/hanzihome/courses/course.schema";

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

export function useCreateCustomHanziHomeCourseBookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHanziHomeCourseBookRequest) =>
      createCustomHanziHomeCourseBook(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: hanzihomeCourseQueryKeys.catalog(),
      });
    },
  });
}

export function useForkSeedHanziHomeCourseMutation() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: (courseId: string) => forkSeedHanziHomeCourse(courseId),
  onSuccess: async () => {
   await Promise.all([
    queryClient.invalidateQueries({
     queryKey: hanzihomeCourseQueryKeys.catalog(),
    }),
    queryClient.invalidateQueries({
     queryKey: ["hanzihome"],
    }),
   ]);
  },
 });
}
