import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  changeUser: defineAction({
    accept: 'form',
    input: z.discriminatedUnion('type', [
      z.object({
        // Matches when the `type` field has the value `create`
        type: z.literal('create'),
        name: z.string(),
        email: z.string().email(),
      }),
      z.object({
        // Matches when the `type` field has the value `update`
        type: z.literal('update'),
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
      }),
    ]),
    async handler(input) {
      if (input.type === 'create') {
        // input is { type: 'create', name: string, email: string }
      } else {
        // input is { type: 'update', id: number, name: string, email: string }
      }
    },
  }),
};