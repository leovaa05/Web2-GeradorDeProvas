import { z } from "zod";
import { positiveIdSchema } from "../../../schemas/idSchema.js";

const dificuldadeSchema = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .pipe(z.coerce.number().int().min(1).max(3));

const respostaCorretaSchema = z.union([
  z.string().trim().min(1).max(500),
  z.null(),
]);

export const createQuestionV2Schema = z
  .object({
    enunciado: z.string().trim().min(3).max(500),
    dificuldade: dificuldadeSchema,
    respostaCorreta: respostaCorretaSchema.optional(),
    subjectId: positiveIdSchema,
    authorId: positiveIdSchema,
    ativa: z.boolean().optional(),
  })
  .strict();

export const updateQuestionV2Schema = z
  .object({
    enunciado: z.string().trim().min(3).max(500).optional(),
    dificuldade: dificuldadeSchema.optional(),
    respostaCorreta: respostaCorretaSchema.optional(),
    subjectId: positiveIdSchema.optional(),
    authorId: positiveIdSchema.optional(),
    ativa: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0);

export const idParamSchema = z.object({
  id: positiveIdSchema,
});
