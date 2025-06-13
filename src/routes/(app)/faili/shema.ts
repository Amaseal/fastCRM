import { z } from 'zod';

export const fileSchema = z.object({
    id: z.number().optional(),
    filename: z.string(),
    downloadUrl: z.string(),
    size: z.number(),
    taskId: z.number().optional(), // Nullable for initial upload
});


export type FileSchema = typeof fileSchema;