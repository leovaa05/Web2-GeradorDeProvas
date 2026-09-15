import prisma from "../config/database.js";

const publicQuestionSelect = {
  id: true,
  enunciado: true,
  dificuldade: true,
  respostaCorreta: true,
  ativa: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: {
      id: true,
      nome: true,
      ativa: true,
    },
  },
  author: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
};

/**
 * Busca todas as questões no formato público, incluindo matéria e autor.
 * @returns {Promise<Object[]>} Lista de questões.
 */
export const getAllQuestions = async () => {
  return prisma.question.findMany({
    select: publicQuestionSelect,
    orderBy: { id: "asc" },
  });
};

/**
 * Busca uma questão pelo identificador único.
 * @param {number} questionId - ID da questão.
 * @returns {Promise<Object|null>} Questão encontrada ou `null` quando ela não existe.
 */
export const getQuestionById = async (questionId) => {
  return prisma.question.findUnique({
    where: { id: questionId },
    select: publicQuestionSelect,
  });
};

/**
 * Cria uma questão depois de confirmar que a matéria e o autor existem.
 * @param {{ enunciado: string, dificuldade: number, respostaCorreta?: string|null, subjectId: number, authorId: number, ativa?: boolean }} questionData - Dados recebidos pelo controller.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da criação ou o motivo da falha.
 */
export const createQuestion = async (questionData) => {
  const subject = await prisma.subject.findUnique({
    where: { id: questionData.subjectId },
    select: { id: true },
  });

  if (!subject) {
    return { ok: false, reason: "SUBJECT_NOT_FOUND" };
  }

  const author = await prisma.user.findUnique({
    where: { id: questionData.authorId },
    select: { id: true },
  });

  if (!author) {
    return { ok: false, reason: "AUTHOR_NOT_FOUND" };
  }

  const question = await prisma.question.create({
    data: {
      enunciado: questionData.enunciado.trim(),
      dificuldade: questionData.dificuldade,
      respostaCorreta: questionData.respostaCorreta ?? null,
      subjectId: questionData.subjectId,
      authorId: questionData.authorId,
      ativa: questionData.ativa ?? true,
    },
    select: publicQuestionSelect,
  });

  return { ok: true, data: question };
};

/**
 * Atualiza somente os campos enviados para uma questão existente.
 * @param {number} questionId - ID da questão a atualizar.
 * @param {{ enunciado?: string, dificuldade?: number, respostaCorreta?: string|null, subjectId?: number, authorId?: number, ativa?: boolean }} questionData - Campos permitidos no PATCH.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Resultado da atualização, inexistência ou matéria/autor inexistente.
 */
export const updateQuestion = async (questionId, questionData) => {
  const questionExistente = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!questionExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const data = {};

  if (Object.hasOwn(questionData, "enunciado")) {
    data.enunciado = questionData.enunciado.trim();
  }

  if (Object.hasOwn(questionData, "dificuldade")) {
    data.dificuldade = questionData.dificuldade;
  }

  if (Object.hasOwn(questionData, "respostaCorreta")) {
    data.respostaCorreta = questionData.respostaCorreta;
  }

  if (Object.hasOwn(questionData, "ativa")) {
    data.ativa = questionData.ativa;
  }

  if (Object.hasOwn(questionData, "subjectId")) {
    const subject = await prisma.subject.findUnique({
      where: { id: questionData.subjectId },
      select: { id: true },
    });

    if (!subject) {
      return { ok: false, reason: "SUBJECT_NOT_FOUND" };
    }

    data.subjectId = questionData.subjectId;
  }

  if (Object.hasOwn(questionData, "authorId")) {
    const author = await prisma.user.findUnique({
      where: { id: questionData.authorId },
      select: { id: true },
    });

    if (!author) {
      return { ok: false, reason: "AUTHOR_NOT_FOUND" };
    }

    data.authorId = questionData.authorId;
  }

  const question = await prisma.question.update({
    where: { id: questionId },
    data,
    select: publicQuestionSelect,
  });

  return { ok: true, data: question };
};

/**
 * Remove uma questão existente.
 * @param {number} questionId - ID da questão a remover.
 * @returns {Promise<{ ok: boolean, data?: Object, reason?: string }>} Questão removida ou motivo da falha.
 */
export const deleteQuestion = async (questionId) => {
  const questionExistente = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!questionExistente) {
    return { ok: false, reason: "NOT_FOUND" };
  }

  const question = await prisma.question.delete({
    where: { id: questionId },
    select: publicQuestionSelect,
  });

  return { ok: true, data: question };
};
