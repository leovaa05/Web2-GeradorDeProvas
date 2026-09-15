// src/controllers/subjectController.js
import prisma from "../config/database.js"; // ajuste o caminho conforme o seu projeto

// Campos públicos do professor que podem ser expostos em relações
const PROFESSOR_SELECT = {
  id: true,
  nome: true, // troque para "name" se o seu model User usar esse nome de campo
  email: true,
};

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export async function create(req, res) {
  try {
    const { nome, professorId, ativa } = req.body;

    // Validação de campos obrigatórios
    if (!nome || professorId === undefined || professorId === null) {
      return res.status(400).json({
        success: false,
        message:
          "Campos obrigatórios ausentes: nome e professorId são necessários",
      });
    }

    // Validação de ID
    if (!isPositiveInt(professorId)) {
      return res.status(400).json({
        success: false,
        message: "professorId deve ser um inteiro positivo",
      });
    }

    // Confirma que o professor existe
    const professor = await prisma.user.findUnique({
      where: { id: Number(professorId) },
    });

    if (!professor) {
      return res.status(404).json({
        success: false,
        message: "Professor não encontrado",
      });
    }

    const subject = await prisma.subject.create({
      data: {
        nome,
        ativa: ativa !== undefined ? Boolean(ativa) : true,
        professorId: Number(professorId),
      },
      include: {
        professor: { select: PROFESSOR_SELECT },
      },
    });

    return res.status(201).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Erro ao criar matéria:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar matéria",
    });
  }
}

export async function getAll(req, res) {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        professor: { select: PROFESSOR_SELECT },
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: subjects,
      total: subjects.length,
    });
  } catch (error) {
    console.error("Erro ao listar matérias:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao listar matérias",
    });
  }
}

export async function getById(req, res) {
  try {
    const { id } = req.params;

    if (!isPositiveInt(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido: deve ser um inteiro positivo",
      });
    }

    const subject = await prisma.subject.findUnique({
      where: { id: Number(id) },
      include: {
        professor: { select: PROFESSOR_SELECT },
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matéria não encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Erro ao buscar matéria:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar matéria",
    });
  }
}
