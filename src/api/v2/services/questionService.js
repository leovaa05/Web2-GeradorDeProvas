import prisma from "../../../config/database.js";
import { NotFoundError } from "../../../errors/AppError.js";

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
    },
  },
  author: {
    select: {
      id: true,
      nome: true,
    },
  },
};

async function ensureSubjectExists(subjectId) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
  }
}

async function ensureAuthorExists(authorId) {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { id: true },
  });

  if (!author) {
    throw new NotFoundError(`Autor com ID ${authorId} não encontrado`);
  }
}

export async function getAllQuestions() {
  return prisma.question.findMany({
    select: publicQuestionSelect,
    orderBy: { id: "asc" },
  });
}

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

export async function createQuestion(data) {
  await ensureSubjectExists(data.subjectId);
  await ensureAuthorExists(data.authorId);

  try {
    return await prisma.question.create({
      data: {
        ...data,
        respostaCorreta: data.respostaCorreta ?? null,
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

export async function updateQuestion(questionId, data) {
  await getQuestionById(questionId);

  if (data.subjectId !== undefined) {
    await ensureSubjectExists(data.subjectId);
  }

  if (data.authorId !== undefined) {
    await ensureAuthorExists(data.authorId);
  }

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

export async function deleteQuestion(questionId) {
  await getQuestionById(questionId);

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
