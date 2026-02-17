import { z } from 'zod';

// Schema for creating a new request
export const CreateRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  category: z.enum(['feature', 'bug', 'improvement']).default('feature'),
});

// Schema for listing requests with filters
export const ListRequestsQuerySchema = z.object({
  status: z.enum(['open', 'planned', 'in_progress', 'completed', 'rejected']).optional(),
  category: z.enum(['feature', 'bug', 'improvement']).optional(),
  sort: z.enum(['votes', 'recent', 'oldest']).default('votes'),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// Schema for updating request status (admin only)
export const UpdateRequestStatusSchema = z.object({
  status: z.enum(['open', 'planned', 'in_progress', 'completed', 'rejected']),
});

// Schema for merging duplicate requests (admin only)
export const MergeRequestsSchema = z.object({
  targetRequestId: z.string().uuid('Invalid target request ID'),
});

export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;
export type ListRequestsQuery = z.infer<typeof ListRequestsQuerySchema>;
export type UpdateRequestStatusInput = z.infer<typeof UpdateRequestStatusSchema>;
export type MergeRequestsInput = z.infer<typeof MergeRequestsSchema>;
