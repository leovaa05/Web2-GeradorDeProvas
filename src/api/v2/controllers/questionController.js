import * as questionService from "../services/questionService.js";

export async function create(req, res, next) {
  try {
    const question = await questionService.createQuestion(req.body);

    return res.status(201).json({
      success: true,
      message: "Questão criada com sucesso",
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAll(req, res, next) {
  try {
    const questions = await questionService.getAllQuestions();

    return res.status(200).json({
      success: true,
      total: questions.length,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const question = await questionService.getQuestionById(
      Number(req.params.id),
    );

    return res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const question = await questionService.updateQuestion(
      Number(req.params.id),
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Questão atualizada com sucesso",
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const question = await questionService.deleteQuestion(
      Number(req.params.id),
    );

    return res.status(200).json({
      success: true,
      message: "Questão removida com sucesso",
      data: question,
    });
  } catch (error) {
    next(error);
  }
}