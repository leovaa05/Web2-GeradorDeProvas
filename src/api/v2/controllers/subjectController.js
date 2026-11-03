import * as subjectService from "../services/subjectService.js";

export async function create(req, res, next) {
  try {
    const subject = await subjectService.createSubject(req.body);

    return res.status(201).json({
      success: true,
      message: "Matéria criada com sucesso",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAll(req, res, next) {
  try {
    const subjects = await subjectService.getAllSubjects();

    return res.status(200).json({
      success: true,
      total: subjects.length,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const subject = await subjectService.getSubjectById(
      Number(req.params.id),
    );

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const subject = await subjectService.updateSubject(
      Number(req.params.id),
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Matéria atualizada com sucesso",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const subject = await subjectService.deleteSubject(
      Number(req.params.id),
    );

    return res.status(200).json({
      success: true,
      message: "Matéria removida com sucesso",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}
