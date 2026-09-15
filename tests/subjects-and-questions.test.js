import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/database.js";

const createdUserIds = [];
const createdSubjectIds = [];
const createdQuestionIds = [];

/**
 * Gera um e-mail único para evitar colisões entre execuções dos testes.
 * @param {string} label - Identificador que facilita reconhecer o teste de origem.
 * @returns {string} E-mail único para uso temporário no banco de testes.
 */
function uniqueEmail(label) {
  return `aula05-${label}-${Date.now()}-${Math.random()}@example.com`;
}

/**
 * Cria um usuário (professor/autor) pela API e registra o ID para limpeza.
 * @param {Object} [overrides={}] - Campos que substituem os valores padrão.
 * @returns {Promise<Object>} Resposta recebida do endpoint `POST /users`.
 */
async function createUser(overrides = {}) {
  const response = await request(app)
    .post("/users")
    .send({
      nome: "Prof. Teste",
      email: uniqueEmail("user"),
      ...overrides,
    });

  if (response.status === 201) {
    createdUserIds.push(response.body.data.id);
  }

  return response;
}

/**
 * Cria uma matéria pela API e registra o ID para limpeza.
 * @param {number} professorId - ID do professor responsável.
 * @param {Object} [overrides={}] - Campos que substituem os valores padrão.
 * @returns {Promise<Object>} Resposta recebida do endpoint `POST /subjects`.
 */
async function createSubject(professorId, overrides = {}) {
  const response = await request(app)
    .post("/subjects")
    .send({
      nome: "Matéria Teste",
      professorId,
      ...overrides,
    });

  if (response.status === 201) {
    createdSubjectIds.push(response.body.data.id);
  }

  return response;
}

/**
 * Cria uma questão pela API e registra o ID para limpeza.
 * @param {number} subjectId - ID da matéria vinculada.
 * @param {number} authorId - ID do autor.
 * @param {Object} [overrides={}] - Campos que substituem os valores padrão.
 * @returns {Promise<Object>} Resposta recebida do endpoint `POST /questions`.
 */
async function createQuestion(subjectId, authorId, overrides = {}) {
  const response = await request(app)
    .post("/questions")
    .send({
      enunciado: "Quanto é 2 + 2?",
      dificuldade: 1,
      subjectId,
      authorId,
      ...overrides,
    });

  if (response.status === 201) {
    createdQuestionIds.push(response.body.data.id);
  }

  return response;
}

// Remove questões, depois matérias, depois usuários, respeitando as relações do banco.
afterEach(async () => {
  if (createdQuestionIds.length > 0) {
    await prisma.question.deleteMany({
      where: { id: { in: createdQuestionIds.splice(0) } },
    });
  }

  if (createdSubjectIds.length > 0) {
    await prisma.subject.deleteMany({
      where: { id: { in: createdSubjectIds.splice(0) } },
    });
  }

  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({
      where: { id: { in: createdUserIds.splice(0) } },
    });
  }
});

describe("Subject API", () => {
  it("cria, lista e busca uma matéria por ID", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id);

    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.professor.id).toBe(professor.body.data.id);

    const list = await request(app).get("/subjects");
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(list.body.data.length);

    const found = await request(app).get(`/subjects/${created.body.data.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(created.body.data.id);
  });

  it("rejeita matéria sem nome ou com professor inexistente", async () => {
    const professor = await createUser();

    const semNome = await request(app)
      .post("/subjects")
      .send({ professorId: professor.body.data.id });
    const professorInexistente = await createSubject(999999999);

    expect(semNome.status).toBe(400);
    expect(professorInexistente.status).toBe(404);
  });

  it("rejeita ID inválido e informa matéria inexistente", async () => {
    const invalido = await request(app).get("/subjects/abc");
    const inexistente = await request(app).get("/subjects/999999999");

    expect(invalido.status).toBe(400);
    expect(inexistente.status).toBe(404);
  });

  it("atualiza somente os campos enviados", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id, {
      nome: "Nome original",
    });

    const response = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({ nome: "Nome atualizado" });

    expect(response.status).toBe(200);
    expect(response.body.data.nome).toBe("Nome atualizado");
    expect(response.body.data.professorId).toBe(professor.body.data.id);
  });

  it("rejeita PATCH vazio e professor inexistente no PATCH", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id);

    const vazio = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({});
    const professorInexistente = await request(app)
      .patch(`/subjects/${created.body.data.id}`)
      .send({ professorId: 999999999 });

    expect(vazio.status).toBe(400);
    expect(professorInexistente.status).toBe(404);
  });

  it("remove uma matéria sem questões vinculadas", async () => {
    const professor = await createUser();
    const created = await createSubject(professor.body.data.id);

    const removed = await request(app).delete(
      `/subjects/${created.body.data.id}`,
    );
    const found = await request(app).get(`/subjects/${created.body.data.id}`);

    expect(removed.status).toBe(200);
    expect(found.status).toBe(404);
  });

  it("impede remover uma matéria com questão vinculada", async () => {
    const professor = await createUser();
    const subject = await createSubject(professor.body.data.id);
    await createQuestion(subject.body.data.id, professor.body.data.id);

    const response = await request(app).delete(
      `/subjects/${subject.body.data.id}`,
    );

    expect(response.status).toBe(409);
  });
});

describe("Question API", () => {
  it("cria, lista e busca uma questão por ID", async () => {
    const professor = await createUser();
    const subject = await createSubject(professor.body.data.id);
    const created = await createQuestion(
      subject.body.data.id,
      professor.body.data.id,
    );

    expect(created.status).toBe(201);
    expect(created.body.data.subject.id).toBe(subject.body.data.id);
    expect(created.body.data.author.id).toBe(professor.body.data.id);

    const list = await request(app).get("/questions");
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(list.body.data.length);

    const found = await request(app).get(`/questions/${created.body.data.id}`);
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(created.body.data.id);
  });

  it("rejeita dificuldade inválida e matéria/autor inexistentes", async () => {
    const professor = await createUser();
    const subject = await createSubject(professor.body.data.id);

    const dificuldadeInvalida = await createQuestion(
      subject.body.data.id,
      professor.body.data.id,
      {
        dificuldade: 9,
      },
    );
    const materiaInexistente = await createQuestion(
      999999999,
      professor.body.data.id,
    );
    const autorInexistente = await createQuestion(
      subject.body.data.id,
      999999999,
    );

    expect(dificuldadeInvalida.status).toBe(400);
    expect(materiaInexistente.status).toBe(404);
    expect(autorInexistente.status).toBe(404);
  });

  it("rejeita ID inválido e informa questão inexistente", async () => {
    const invalido = await request(app).get("/questions/abc");
    const inexistente = await request(app).get("/questions/999999999");

    expect(invalido.status).toBe(400);
    expect(inexistente.status).toBe(404);
  });

  it("atualiza somente os campos enviados, preservando os demais", async () => {
    const professor = await createUser();
    const subject = await createSubject(professor.body.data.id);
    const created = await createQuestion(
      subject.body.data.id,
      professor.body.data.id,
      {
        enunciado: "Enunciado original",
      },
    );

    const response = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({ dificuldade: 3 });

    expect(response.status).toBe(200);
    expect(response.body.data.dificuldade).toBe(3);
    expect(response.body.data.enunciado).toBe("Enunciado original");
  });

  it("rejeita PATCH vazio", async () => {
    const professor = await createUser();
    const subject = await createSubject(professor.body.data.id);
    const created = await createQuestion(
      subject.body.data.id,
      professor.body.data.id,
    );

    const response = await request(app)
      .patch(`/questions/${created.body.data.id}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("remove uma questão e confirma com 404 na busca posterior", async () => {
    const professor = await createUser();
    const subject = await createSubject(professor.body.data.id);
    const created = await createQuestion(
      subject.body.data.id,
      professor.body.data.id,
    );

    const removed = await request(app).delete(
      `/questions/${created.body.data.id}`,
    );
    const found = await request(app).get(`/questions/${created.body.data.id}`);

    expect(removed.status).toBe(200);
    expect(found.status).toBe(404);
  });
});
