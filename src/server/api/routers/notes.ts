import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '../trpc'

const id = process.env.TODOS_ID ?? ''

export const notesRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    try {
      return await ctx.prisma.note.findFirstOrThrow({
        where: {
          id,
        },
      })
    } catch (error) {
      console.log(error)
    }
  }),
  save: publicProcedure
    .input(
      z.object({
        id: z.string().nullish(),
        text: z.string().nullish(),
        title: z.string().nullish(),
        body: z.string().nullish(),
        author: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const text = input.text ?? 'untitled\nbody'
      const title = input.title ?? 'untitled'

      const newNote = {
        text,
        title,
        body: input.body ?? 'body',
        author: input.author,
      }

      try {
        return await ctx.prisma.note.upsert({
          where: {
            id: input.id ?? '',
          },
          update: newNote,
          create: newNote,
        })
      } catch (error) {
        console.log(error)
      }
    }),

  // getSecretMessage: protectedProcedure.query(() => {
  //   return 'you can now see this secret message!'
  // }),
})
