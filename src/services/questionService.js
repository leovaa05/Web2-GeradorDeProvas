import prisma from "../config/database.js";
import { NotFoundError } from "../errors/AppError.js";

const publicPersonSelect = { id: true, nome: true };

const publicQuestionSelect = {
  id: true,
  enunciado: true,
  dificuldade: true,
  respostaCorreta: true,
  ativa: true,
  createdAt: true,
  updatedAt: true,
  subject: { select: { id: true, nome: true } },
  author: { select: publicPersonSelect },
};

/**
 * Busca todas as questões com matéria e autor públicos.
 * @returns {Promise<object[]>} Lista de questões.
 */
export function getAllQuestions() {
  return prisma.question.findMany({
    select: publicQuestionSelect,
    orderBy: { id: "asc" },
  });
}

/**
 * Busca uma questão por ID.
 * @param {number} questionId - ID já validado pelo middleware.
 * @returns {Promise<object>} Questão pública encontrada.
 * @throws {NotFoundError} Quando a questão não existe.
 */
export async function getQuestionById(questionId) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: publicQuestionSelect,
  });

  if (!question) {
    throw new NotFoundError(`Questão com ID ${questionId} não encontrada`);
  }

  return question;
}

/**
 * Confirma que a matéria informada existe.
 * @param {number} subjectId - ID a verificar.
 * @throws {NotFoundError} Quando a matéria não existe.
 */
async function ensureSubjectExists(subjectId) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
  }
}

/**
 * Confirma que o autor informado existe.
 * @param {number} authorId - ID a verificar.
 * @throws {NotFoundError} Quando o autor não existe.
 */
async function ensureAuthorExists(authorId) {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true },
  });

  if (!author) {
    throw new NotFoundError(`Autor com ID ${authorId} não encontrado`);
  }
}

/**
 * Cria uma questão após confirmar que matéria e autor existem.
 * @param {{enunciado: string, dificuldade: number, respostaCorreta?: string|null, subjectId: number, authorId: number, ativa?: boolean}} data - Dados validados pelo Zod.
 * @returns {Promise<object>} Questão pública criada.
 * @throws {NotFoundError} Quando a matéria ou o autor não existem.
 */
export async function createQuestion(data) {
  await Promise.all([
    ensureSubjectExists(data.subjectId),
    ensureAuthorExists(data.authorId),
  ]);

  try {
    return await prisma.question.create({
      data: {
        enunciado: data.enunciado,
        dificuldade: data.dificuldade,
        respostaCorreta: data.respostaCorreta ?? null,
        subjectId: data.subjectId,
        authorId: data.authorId,
        ativa: data.ativa ?? true,
      },
      select: publicQuestionSelect,
    });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new NotFoundError("Matéria ou autor informado não encontrado");
    }
    throw error;
  }
}

/**
 * Atualiza campos parciais de uma questão existente.
 * @param {number} questionId - ID já validado pelo middleware.
 * @param {{enunciado?: string, dificuldade?: number, respostaCorreta?: string|null, subjectId?: number, authorId?: number, ativa?: boolean}} data - Campos permitidos.
 * @returns {Promise<object>} Questão pública atualizada.
 * @throws {NotFoundError} Quando a questão, a matéria ou o autor não existem.
 */
export async function updateQuestion(questionId, data) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!question) {
    throw new NotFoundError(`Questão com ID ${questionId} não encontrada`);
  }

  const checks = [];
  if (data.subjectId !== undefined)
    checks.push(ensureSubjectExists(data.subjectId));
  if (data.authorId !== undefined)
    checks.push(ensureAuthorExists(data.authorId));
  await Promise.all(checks);

  try {
    return await prisma.question.update({
      where: { id: questionId },
      data,
      select: publicQuestionSelect,
    });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new NotFoundError("Matéria ou autor informado não encontrado");
    }
    if (error?.code === "P2025") {
      throw new NotFoundError(`Questão com ID ${questionId} não encontrada`);
    }
    throw error;
  }
}

/**
 * Remove uma questão existente.
 * @param {number} questionId - ID já validado pelo middleware.
 * @returns {Promise<object>} Questão pública removida.
 * @throws {NotFoundError} Quando a questão não existe.
 */
export async function deleteQuestion(questionId) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!question) {
    throw new NotFoundError(`Questão com ID ${questionId} não encontrada`);
  }

  try {
    return await prisma.question.delete({
      where: { id: questionId },
      select: publicQuestionSelect,
    });
  } catch (error) {
    if (error?.code === "P2025") {
      throw new NotFoundError(`Questão com ID ${questionId} não encontrada`);
    }
    throw error;
  }
}
