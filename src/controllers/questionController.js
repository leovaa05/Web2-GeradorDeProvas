import * as questionService from "../services/questionService.js";

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export async function create(req, res) {
  try {
    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body;

    if (!enunciado || typeof enunciado !== "string" || !enunciado.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório ausente: enunciado",
      });
    }

    const dificuldadeNum = Number(dificuldade);
    if (
      dificuldade === undefined ||
      dificuldade === null ||
      ![1, 2, 3].includes(dificuldadeNum)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "dificuldade é obrigatória e deve ser 1 (fácil), 2 (média) ou 3 (difícil)",
      });
    }

    if (
      subjectId === undefined ||
      subjectId === null ||
      !isPositiveInt(subjectId)
    ) {
      return res.status(400).json({
        success: false,
        message: "subjectId é obrigatório e deve ser um inteiro positivo",
      });
    }

    if (
      authorId === undefined ||
      authorId === null ||
      !isPositiveInt(authorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "authorId é obrigatório e deve ser um inteiro positivo",
      });
    }

    if (
      respostaCorreta !== undefined &&
      respostaCorreta !== null &&
      typeof respostaCorreta !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "respostaCorreta deve ser texto ou null",
      });
    }

    if (ativa !== undefined && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    const result = await questionService.createQuestion({
      enunciado,
      dificuldade: dificuldadeNum,
      respostaCorreta,
      subjectId: Number(subjectId),
      authorId: Number(authorId),
      ativa,
    });

    if (!result.ok) {
      if (result.reason === "SUBJECT_NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Matéria não encontrada" });
      }
      if (result.reason === "AUTHOR_NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Autor não encontrado" });
      }
    }

    return res.status(201).json({ success: true, data: result.data });
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
    const questions = await questionService.getAllQuestions();

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

    const question = await questionService.getQuestionById(Number(id));

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Questão não encontrada",
      });
    }

    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    console.error("Erro ao buscar questão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar questão",
    });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const {
      enunciado,
      dificuldade,
      respostaCorreta,
      subjectId,
      authorId,
      ativa,
    } = req.body ?? {};

    if (!isPositiveInt(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido: deve ser um inteiro positivo",
      });
    }

    const allowedFields = [
      "enunciado",
      "dificuldade",
      "respostaCorreta",
      "subjectId",
      "authorId",
      "ativa",
    ];
    const sentFields = allowedFields.filter((field) =>
      Object.hasOwn(req.body ?? {}, field),
    );

    if (sentFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Informe ao menos um campo para atualizar",
      });
    }

    if (
      Object.hasOwn(req.body, "enunciado") &&
      (typeof enunciado !== "string" || !enunciado.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "enunciado não pode ser vazio",
      });
    }

    if (
      Object.hasOwn(req.body, "dificuldade") &&
      ![1, 2, 3].includes(Number(dificuldade))
    ) {
      return res.status(400).json({
        success: false,
        message: "dificuldade deve ser 1 (fácil), 2 (média) ou 3 (difícil)",
      });
    }

    if (
      Object.hasOwn(req.body, "respostaCorreta") &&
      respostaCorreta !== null &&
      typeof respostaCorreta !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "respostaCorreta deve ser texto ou null",
      });
    }

    if (Object.hasOwn(req.body, "subjectId") && !isPositiveInt(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "subjectId deve ser um inteiro positivo",
      });
    }

    if (Object.hasOwn(req.body, "authorId") && !isPositiveInt(authorId)) {
      return res.status(400).json({
        success: false,
        message: "authorId deve ser um inteiro positivo",
      });
    }

    if (Object.hasOwn(req.body, "ativa") && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    const result = await questionService.updateQuestion(Number(id), {
      ...(Object.hasOwn(req.body, "enunciado") && { enunciado }),
      ...(Object.hasOwn(req.body, "dificuldade") && {
        dificuldade: Number(dificuldade),
      }),
      ...(Object.hasOwn(req.body, "respostaCorreta") && { respostaCorreta }),
      ...(Object.hasOwn(req.body, "subjectId") && {
        subjectId: Number(subjectId),
      }),
      ...(Object.hasOwn(req.body, "authorId") && {
        authorId: Number(authorId),
      }),
      ...(Object.hasOwn(req.body, "ativa") && { ativa }),
    });

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Questão não encontrada" });
      }
      if (result.reason === "SUBJECT_NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Matéria não encontrada" });
      }
      if (result.reason === "AUTHOR_NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Autor não encontrado" });
      }
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("Erro ao atualizar questão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar questão",
    });
  }
}

export async function remove(req, res) {
  try {
    const { id } = req.params;

    if (!isPositiveInt(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido: deve ser um inteiro positivo",
      });
    }

    const result = await questionService.deleteQuestion(Number(id));

    if (!result.ok) {
      return res
        .status(404)
        .json({ success: false, message: "Questão não encontrada" });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("Erro ao remover questão:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao remover questão",
    });
  }
}
