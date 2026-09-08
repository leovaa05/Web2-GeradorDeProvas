//src/app.js
import express from "express";
import prisma from "./config/database.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "OK",
      message: "API do Gerador de Provas",
      timestamp: new Date().toISOString(),
      services: {
        api: "OK",
        database: { status: "OK" },
      },
    });
  } catch (error) {
    console.error("Erro na verificação do banco:", error);

    res.status(503).json({
      status: "DEGRADED",
      message: "API do Gerador de Provas",
      services: {
        api: "OK",
        database: { status: "ERROR" },
      },
    });
  }
});

app.use("/users", userRoutes);

app.get("/subjects", async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        nome: true,
        ativa: true,
        createdAt: true,
        updatedAt: true,
        professor: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.status(200).json({
      success: true,
      data: subjects,
      total: subjects.length,
    });
  } catch (error) {
    console.error("Erro ao buscar matérias:", error);

    res.status(500).json({
      success: false,
      message: "Erro ao buscar matérias",
    });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      select: {
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
            email: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.status(200).json({
      success: true,
      data: questions,
      total: questions.length,
    });
  } catch (error) {
    console.error("Erro ao buscar questões:", error);

    res.status(500).json({
      success: false,
      message: "Erro ao buscar questões",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Rota " + req.method + " " + req.originalUrl + " não encontrada",
  });
});

export default app;
