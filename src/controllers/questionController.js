// src/controllers/questionController.js
import prisma from "../config/database.js"; // ajuste o caminho conforme o seu projeto

const AUTHOR_SELECT = {
  id: true,
  nome: true, // troque para "name" se necessário
  email: true,
};

const SUBJECT_SELECT = {
  id: true,
  nome: true,
  ativa: true,
};

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export async function create(req, res) {
  try {
    const { enunciado, dificuldade, respostaCorreta, subjectId, authorId, ativa } = req.body;

    // Validação de campos obrigatórios
    if (
      !enunciado ||
      dificuldade === undefined ||
      dificuldade === null ||
      subjectId === undefined ||
      subjectId === null ||
      authorId === undefined ||
      authorId === null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Campos obrigatórios ausentes: enunciado, dificuldade, subjectId e authorId são necessários",
      });
    }

    // Validação da dificuldade (1, 2 ou 3)
    const dificuldadeNum = Number(dificuldade);
    if (![1, 2, 3].includes(dificuldadeNum)) {
      return res.status(400).json({
        success: false,
        message: "dificuldade deve ser 1 (fácil), 2 (média) ou 3 (difícil)",
      });
    }

    // Validação de IDs
    if (!isPositiveInt(subjectId) || !isPositiveInt(authorId)) {
      return res.status(400).json({
        success: false,
        message: "subjectId e authorId devem ser inteiros positivos",
      });
    }

    // Confirma que a matéria existe
    const subject = await prisma.subject.findUnique({
      where: { id: Number(subjectId) },
    });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matéria não encontrada",
      });
    }

    // Confirma que o autor existe
    const author = await prisma.user.findUnique({
      where: { id: Number(authorId) },
    });
    if (!author) {
      return res.status(404).json({
        success: false,
        message: "Autor não encontrado",
      });
    }

    const question = await prisma.question.create({
      data: {
        enunciado,
        dificuldade: dificuldadeNum,
        respostaCorreta: respostaCorreta ?? null,
        subjectId: Number(subjectId),
        authorId: Number(authorId),
        ativa: ativa !== undefined ? Boolean(ativa) : true,
      },
      include: {
        subject: { select: SUBJECT_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    });

    return res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Erro ao criar questão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar questão",
    });
  }
}

export async function getAll(req, res) {
  try {
    const questions = await prisma.question.findMany({
      include: {
        subject: { select: SUBJECT_SELECT },
        author: { select: AUTHOR_SELECT },
      },
      orderBy: { id: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: questions,
      total: questions.length,
    });
  } catch (error) {
    console.error("Erro ao listar questões:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao listar questões",
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

    const question = await prisma.question.findUnique({
      where: { id: Number(id) },
      include: {
        subject: { select: SUBJECT_SELECT },
        author: { select: AUTHOR_SELECT },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Questão não encontrada",
      });
    }

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    console.error("Erro ao buscar questão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar questão",
    });
  }
}