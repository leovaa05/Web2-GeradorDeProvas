import * as subjectService from "../services/subjectService.js";

function isPositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}

export async function create(req, res) {
  try {
    const { nome, professorId, ativa } = req.body;

    if (!nome || typeof nome !== "string" || !nome.trim()) {
      return res.status(400).json({
        success: false,
        message: "Campo obrigatório ausente: nome",
      });
    }

    if (
      professorId === undefined ||
      professorId === null ||
      !isPositiveInt(professorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "professorId é obrigatório e deve ser um inteiro positivo",
      });
    }

    if (ativa !== undefined && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    const result = await subjectService.createSubject({
      nome,
      professorId: Number(professorId),
      ativa,
    });

    if (!result.ok) {
      return res.status(404).json({
        success: false,
        message: "Professor não encontrado",
      });
    }

    return res.status(201).json({ success: true, data: result.data });
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
    const subjects = await subjectService.getAllSubjects();

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

    const subject = await subjectService.getSubjectById(Number(id));

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Matéria não encontrada",
      });
    }

    return res.status(200).json({ success: true, data: subject });
  } catch (error) {
    console.error("Erro ao buscar matéria:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao buscar matéria",
    });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { nome, ativa, professorId } = req.body;

    if (!isPositiveInt(id)) {
      return res.status(400).json({
        success: false,
        message: "ID inválido: deve ser um inteiro positivo",
      });
    }

    const allowedFields = ["nome", "ativa", "professorId"];
    const sentFields = allowedFields.filter((field) =>
      Object.hasOwn(req.body ?? {}, field),
    );

    if (sentFields.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Informe ao menos um campo para atualizar: nome, ativa ou professorId",
      });
    }

    if (
      Object.hasOwn(req.body, "nome") &&
      (typeof nome !== "string" || !nome.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "nome não pode ser vazio",
      });
    }

    if (Object.hasOwn(req.body, "ativa") && typeof ativa !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "ativa deve ser um booleano",
      });
    }

    if (Object.hasOwn(req.body, "professorId") && !isPositiveInt(professorId)) {
      return res.status(400).json({
        success: false,
        message: "professorId deve ser um inteiro positivo",
      });
    }

    const result = await subjectService.updateSubject(Number(id), {
      ...(Object.hasOwn(req.body, "nome") && { nome }),
      ...(Object.hasOwn(req.body, "ativa") && { ativa }),
      ...(Object.hasOwn(req.body, "professorId") && {
        professorId: Number(professorId),
      }),
    });

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Matéria não encontrada" });
      }
      if (result.reason === "PROFESSOR_NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Professor não encontrado" });
      }
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("Erro ao atualizar matéria:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar matéria",
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

    const result = await subjectService.deleteSubject(Number(id));

    if (!result.ok) {
      if (result.reason === "NOT_FOUND") {
        return res
          .status(404)
          .json({ success: false, message: "Matéria não encontrada" });
      }
      if (result.reason === "SUBJECT_IN_USE") {
        return res.status(409).json({
          success: false,
          message: "Matéria possui questões vinculadas e não pode ser removida",
        });
      }
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("Erro ao remover matéria:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao remover matéria",
    });
  }
}
