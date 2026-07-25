import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ratingTagsService } from "../../services/ratingTags.service";

export const ratingTagKeys = {
  all: ["ratingTags"],
  list: (filters) => [...ratingTagKeys.all, { filters }],
  detail: (id) => [...ratingTagKeys.all, "detail", id],
};

export const useRatingTags = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ratingTagKeys.list(filters),
    queryFn: () => ratingTagsService.getAll(filters),
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useRatingTag = (id, options = {}) => {
  return useQuery({
    queryKey: ratingTagKeys.detail(id),
    queryFn: () => ratingTagsService.getById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateRatingTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => ratingTagsService.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ratingTagKeys.all }),
  });
};

export const useUpdateRatingTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => ratingTagsService.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ratingTagKeys.all }),
  });
};

export const useDeleteRatingTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => ratingTagsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ratingTagKeys.all }),
  });
};

export const useToggleRatingTagActive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => ratingTagsService.toggleActive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ratingTagKeys.all }),
  });
};
