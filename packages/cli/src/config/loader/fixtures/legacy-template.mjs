import { z } from "zod";

export const MultiClientConfigSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    directory: z.string().min(1)
  }),
  clients: z.array(z.object({ name: z.string().min(1) })).min(1)
});

export async function generateClients() {}
