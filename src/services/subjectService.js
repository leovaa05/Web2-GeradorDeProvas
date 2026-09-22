import prisma from "../config/database.js";
import { ConflictError, NotFoundError } from "../errors/AppError.js";

const publicProfessorSelect = { id: true, nome: true };

const publicSubjectSelect = {
  id: true,
  nome: true,
  ativa: true,
  professorId: true,
  createdAt: true,
  updatedAt: true,
  professor: { select: publicProfessorSelect },
};

/**
 * Busca todas as matérias com os dados públicos do professor.
 * @returns {Promise<object[]>} Lista de matérias.
 */
export function getAllSubjects() {
  return prisma.subject.findMany({
    select: publicSubjectSelect,
    orderBy: { id: "asc" },
  });
}

/**
 * Busca uma matéria por ID.
 * @param {number} subjectId - ID já validado pelo middleware.
 * @returns {Promise<object>} Matéria pública encontrada.
 * @throws {NotFoundError} Quando a matéria não existe.
 */
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

/**
 * Confirma que um professor existe antes de vincular uma matéria a ele.
 * @param {number} professorId - ID a verificar.
 * @throws {NotFoundError} Quando o professor não existe.
 */
async function ensureProfessorExists(professorId) {
  const professor = await prisma.user.findUnique({
    where: { id: professorId },
    select: { id: true },
  });

  if (!professor) {
    throw new NotFoundError(`Professor com ID ${professorId} não encontrado`);
  }
}

/**
 * Cria uma matéria após confirmar que o professor existe.
 * @param {{nome: string, professorId: number, ativa?: boolean}} data - Dados validados pelo Zod.
 * @returns {Promise<object>} Matéria pública criada.
 * @throws {NotFoundError} Quando o professor informado não existe.
 */
export async function createSubject(data) {
  await ensureProfessorExists(data.professorId);

  try {
    return await prisma.subject.create({
      data: {
        nome: data.nome,
        professorId: data.professorId,
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

/**
 * Atualiza campos parciais de uma matéria existente.
 * @param {number} subjectId - ID já validado pelo middleware.
 * @param {{nome?: string, professorId?: number, ativa?: boolean}} data - Campos permitidos.
 * @returns {Promise<object>} Matéria pública atualizada.
 * @throws {NotFoundError} Quando a matéria ou o novo professor não existem.
 */
export async function updateSubject(subjectId, data) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });

  if (!subject) {
    throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
  }

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

/**
 * Remove uma matéria que não possua questões vinculadas.
 * @param {number} subjectId - ID já validado pelo middleware.
 * @returns {Promise<object>} Matéria pública removida.
 * @throws {NotFoundError} Quando a matéria não existe.
 * @throws {ConflictError} Quando há questões vinculadas.
 */
export async function deleteSubject(subjectId) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: {
      id: true,
      _count: { select: { questions: true } },
    },
  });

  if (!subject) {
    throw new NotFoundError(`Matéria com ID ${subjectId} não encontrada`);
  }

  if (subject._count.questions > 0) {
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
