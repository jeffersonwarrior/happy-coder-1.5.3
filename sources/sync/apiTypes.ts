import { z } from 'zod';

import { GitHubProfileSchema, ImageRefSchema } from './profile';

//
// Encrypted message
//

export const ApiMessageSchema = z.object({
  id: z.string(),
  seq: z.number(),
  localId: z.string().nullish(),
  content: z.object({
    t: z.literal('encrypted'),
    c: z.string(), // Base64 encoded encrypted content
  }),
  createdAt: z.number(),
});

export type ApiMessage = z.infer<typeof ApiMessageSchema>;

//
// Updates
//

export const ApiUpdateNewMessageSchema = z.object({
  t: z.literal('new-message'),
  sid: z.string(), // Session ID
  message: ApiMessageSchema,
});

export const ApiUpdateNewSessionSchema = z.object({
  t: z.literal('new-session'),
  id: z.string(), // Session ID
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ApiUpdateSessionStateSchema = z.object({
  t: z.literal('update-session'),
  id: z.string(),
  agentState: z.object({
    version: z.number(),
    value: z.string(),
  }).nullish(),
  metadata: z.object({
    version: z.number(),
    value: z.string(),
  }).nullish(),
});

export const ApiUpdateAccountSchema = z.object({
  t: z.literal('update-account'),
  id: z.string(),
  settings: z.object({
    value: z.string().nullish(),
    version: z.number(),
  }).nullish(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  avatar: ImageRefSchema.nullish(),
  github: GitHubProfileSchema.nullish(),
});

export const ApiUpdateMachineStateSchema = z.object({
  t: z.literal('update-machine'),
  machineId: z.string(),  // Changed from 'id' to 'machineId' for clarity
  metadata: z.object({
    version: z.number(),
    value: z.string(), // Encrypted, client decrypts
  }).nullish(),
  daemonState: z.object({
    version: z.number(),
    value: z.string(), // Encrypted, client decrypts
  }).nullish(),
  active: z.boolean().optional(),
  activeAt: z.number().optional(),
});

export const ApiUpdateSchema = z.discriminatedUnion('t', [
  ApiUpdateNewMessageSchema,
  ApiUpdateNewSessionSchema,
  ApiUpdateSessionStateSchema,
  ApiUpdateAccountSchema,
  ApiUpdateMachineStateSchema,
]);

export type ApiUpdateNewMessage = z.infer<typeof ApiUpdateNewMessageSchema>;
export type ApiUpdate = z.infer<typeof ApiUpdateSchema>;

//
// API update container
//

export const ApiUpdateContainerSchema = z.object({
  id: z.string(),
  seq: z.number(),
  body: ApiUpdateSchema,
  createdAt: z.number(),
});

export type ApiUpdateContainer = z.infer<typeof ApiUpdateContainerSchema>;

//
// Ephemeral update
//

export const ApiEphemeralActivityUpdateSchema = z.object({
  type: z.literal('activity'),
  id: z.string(),
  active: z.boolean(),
  activeAt: z.number(),
  thinking: z.boolean(),
});

export const ApiEphemeralUsageUpdateSchema = z.object({
  type: z.literal('usage'),
  id: z.string(),
  key: z.string(),
  timestamp: z.number(),
  tokens: z.object({
    total: z.number(),
    input: z.number(),
    output: z.number(),
    cache_creation: z.number(),
    cache_read: z.number(),
  }),
  cost: z.object({
    total: z.number(),
    input: z.number(),
    output: z.number(),
  }),
});

export const ApiEphemeralMachineActivityUpdateSchema = z.object({
  type: z.literal('machine-activity'),
  id: z.string(), // machine id
  active: z.boolean(),
  activeAt: z.number(),
});

export const ApiEphemeralUpdateSchema = z.union([
  ApiEphemeralActivityUpdateSchema,
  ApiEphemeralUsageUpdateSchema,
  ApiEphemeralMachineActivityUpdateSchema,
]);

export type ApiEphemeralActivityUpdate = z.infer<typeof ApiEphemeralActivityUpdateSchema>;
export type ApiEphemeralUpdate = z.infer<typeof ApiEphemeralUpdateSchema>;

// Machine metadata updates use Partial<MachineMetadata> from storageTypes
// This matches how session metadata updates work