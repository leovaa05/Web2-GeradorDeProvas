import { z } from "zod";
import { positiveIdSchema } from "./idSchema.js";

/** Aceita texto não vazio (até 500 caracteres) ou null explícito para limpar a resposta. */
const respostaCorretaSchema = z.union([
  z
    .string()
    .trim()
    .min(1, "Resposta correta não pode ser vazia")
    .max(500, "Resposta correta deve ter no máximo 500 caracteres"),
  z.null(),
]);

/** Aceita números ou texto decimal, nunca booleanos, arrays ou objetos. */
const dificuldadeInputSchema = z.union([
  z.number(),
  z.string().regex(/^\d+$/, "Use um número inteiro em formato decimal"),
]);

/** Dificuldade inteira entre 1 (fácil) e 3 (difícil). */
const dificuldadeSchema = dificuldadeInputSchema.pipe(
  z.coerce
    .number()
    .int("Dificuldade deve ser um número inteiro")
    .min(1, "Dificuldade mínima é 1")
    .max(3, "Dificuldade máxima é 3"),
);

/** Schema para POST /questions. */
export const createQuestionSchema = z
  .object({
    enunciado: z
      .string()
      .trim()
      .min(3, "Enunciado deve ter pelo menos 3 caracteres")
      .max(500, "Enunciado deve ter no máximo 500 caracteres"),
    dificuldade: dificuldadeSchema,
    respostaCorreta: respostaCorretaSchema.optional(),
    subjectId: positiveIdSchema,
    authorId: positiveIdSchema,
    ativa: z.boolean().optional(),
  })
  .strict();

/** Schema para PATCH /questions/:id. */
export const updateQuestionSchema = z
  .object({
    enunciado: z
      .string()
      .trim()
      .min(3, "Enunciado deve ter pelo menos 3 caracteres")
      .max(500, "Enunciado deve ter no máximo 500 caracteres")
      .optional(),
    dificuldade: dificuldadeSchema.optional(),
    respostaCorreta: respostaCorretaSchema.optional(),
    subjectId: positiveIdSchema.optional(),
    authorId: positiveIdSchema.optional(),
    ativa: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Envie pelo menos um campo para atualização",
  });

/** Schema para parâmetros :id positivos. */
export const idParamSchema = z.object({
  id: positiveIdSchema,
});
