import prisma from "../../../config/database.js";
import { ConflictError, NotFoundError } from "../../../errors/AppError.js";

const publicSubjectSelect = {
  id: true,
  nome: true,
  ativa: true,
  professorId: true,
  createdAt: true,
  updatedAt: true,
  professor: {
    select: {
      id: true,
      nome: true,
    },
  },
};

async function ensureProfessorExists(professorId) {
  const professor = await prisma.user.findUnique({
    where: { id: professorId },
    select: { id: true },
  });

  if (!professor) {
    throw new NotFoundError(
      `Professor com ID ${professorId} não encontrado`,
    );
  }
}

export async function getAllSubjects() {
  return prisma.subject.findMany({
    select: publicSubjectSelect,
    orderBy: { id: "asc" },
  });
}

export async function getSubjectById(subjectId) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: publicSubjectSelect,
  });

  if (!subject) {
    throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
  }

  return subject;
}

export async function createSubject(data) {
  await ensureProfessorExists(data.professorId);

  try {
    return await prisma.subject.create({
      data: {
        ...data,
        ativa: data.ativa ?? true,
      },
      select: publicSubjectSelect,
    });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new NotFoundError(
        `Professor com ID ${data.professorId} não encontrado`,
      );
    }

    throw error;
  }
}

export async function updateSubject(subjectId, data) {
  await getSubjectById(subjectId);

  if (data.professorId !== undefined) {
    await ensureProfessorExists(data.professorId);
  }

  try {
    return await prisma.subject.update({
      where: { id: subjectId },
      data,
      select: publicSubjectSelect,
    });
  } catch (error) {
    if (error?.code === "P2003") {
      throw new NotFoundError(
        `Professor com ID ${data.professorId} não encontrado`,
      );
    }

    if (error?.code === "P2025") {
      throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
    }

    throw error;
  }
}

export async function deleteSubject(subjectId) {
  await getSubjectById(subjectId);

  const questionsCount = await prisma.question.count({
    where: { subjectId },
  });

  if (questionsCount > 0) {
    throw new ConflictError("Matéria possui questões vinculadas");
  }

  try {
    return await prisma.subject.delete({
      where: { id: subjectId },
      select: publicSubjectSelect,
    });
  } catch (error) {
    if (error?.code === "P2003" || error?.code === "P2014") {
      throw new ConflictError("Matéria possui questões vinculadas");
    }

    if (error?.code === "P2025") {
      throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
    }

    throw error;
  }
}