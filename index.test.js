// Carrega as configurações exclusivas do ambiente de teste
require("dotenv").config({
  path: ".env.test",
  override: true,
  quiet: true
});

const request = require("supertest");

const { app, pool } = require("./index");

let ordemId;


// Limpa a tabela antes dos testes
beforeAll(async () => {
  await pool.query("DELETE FROM ordens");

  // Reinicia a sequência de IDs
  await pool.query(
    "ALTER SEQUENCE ordens_id_seq RESTART WITH 1"
  );
});


describe("OS Service", () => {

  // ======================================================
  // GET /
  // ======================================================

  test("GET / deve informar que o serviço está funcionando", async () => {

    const resposta = await request(app)
      .get("/");

    expect(resposta.status).toBe(200);

    expect(resposta.body).toEqual({
      mensagem: "OS Service está funcionando!"
    });

  });


  // ======================================================
  // POST /ordens
  // ======================================================

  test("POST /ordens deve criar uma nova ordem", async () => {

    const resposta = await request(app)
      .post("/ordens")
      .send({
        cliente: "Cliente Teste",
        veiculo: "Carro Teste",
        problema: "Problema Teste"
      });

    expect(resposta.status).toBe(201);

    expect(resposta.body.cliente)
      .toBe("Cliente Teste");

    expect(resposta.body.veiculo)
      .toBe("Carro Teste");

    expect(resposta.body.problema)
      .toBe("Problema Teste");

    expect(resposta.body.status)
      .toBe("ABERTA");

    expect(resposta.body.id)
      .toBeDefined();

    // Guarda o ID para os testes seguintes
    ordemId = resposta.body.id;

  });


  test("POST /ordens deve retornar 400 quando faltar campo obrigatório", async () => {

    const resposta = await request(app)
      .post("/ordens")
      .send({
        cliente: "Cliente Teste",
        veiculo: "Carro Teste"
      });

    expect(resposta.status).toBe(400);

    expect(resposta.body.mensagem)
      .toBe(
        "Cliente, veículo e problema são obrigatórios"
      );

  });


  // ======================================================
  // GET /ordens
  // ======================================================

  test("GET /ordens deve listar as ordens", async () => {

    const resposta = await request(app)
      .get("/ordens");

    expect(resposta.status).toBe(200);

    expect(Array.isArray(resposta.body))
      .toBe(true);

    expect(resposta.body.length)
      .toBeGreaterThan(0);

  });


  // ======================================================
  // GET /ordens/:id
  // ======================================================

  test("GET /ordens/:id deve buscar uma ordem existente", async () => {

    const resposta = await request(app)
      .get(`/ordens/${ordemId}`);

    expect(resposta.status).toBe(200);

    expect(resposta.body.id)
      .toBe(ordemId);

    expect(resposta.body.cliente)
      .toBe("Cliente Teste");

  });


  test("GET /ordens/:id deve retornar 404 para ordem inexistente", async () => {

    const resposta = await request(app)
      .get("/ordens/999999");

    expect(resposta.status).toBe(404);

    expect(resposta.body.mensagem)
      .toBe("Ordem de serviço não encontrada");

  });


  // ======================================================
  // PATCH /ordens/:id/status
  // ======================================================

  test("PATCH /ordens/:id/status deve atualizar o status", async () => {

    const resposta = await request(app)
      .patch(`/ordens/${ordemId}/status`)
      .send({
        status: "EM_DIAGNOSTICO"
      });

    expect(resposta.status).toBe(200);

    expect(resposta.body.status)
      .toBe("EM_DIAGNOSTICO");

  });


  test("PATCH /ordens/:id/status deve rejeitar status inválido", async () => {

    const resposta = await request(app)
      .patch(`/ordens/${ordemId}/status`)
      .send({
        status: "STATUS_INVENTADO"
      });

    expect(resposta.status).toBe(400);

    expect(resposta.body.mensagem)
      .toBe("Status inválido");

  });


  test("PATCH /ordens/:id/status deve exigir o status", async () => {

    const resposta = await request(app)
      .patch(`/ordens/${ordemId}/status`)
      .send({});

    expect(resposta.status).toBe(400);

    expect(resposta.body.mensagem)
      .toBe("O novo status é obrigatório");

  });


  test("PATCH /ordens/:id/status deve retornar 404 para ordem inexistente", async () => {

    const resposta = await request(app)
      .patch("/ordens/999999/status")
      .send({
        status: "FINALIZADA"
      });

    expect(resposta.status).toBe(404);

    expect(resposta.body.mensagem)
      .toBe("Ordem de serviço não encontrada");

  });

});


// Limpa os dados e fecha o PostgreSQL no final
afterAll(async () => {

  await pool.query("DELETE FROM ordens");

  await pool.end();

});