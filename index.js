// Importa o Express, ferramenta usada para criar o servidor e as rotas da API
const express = require("express");

// Carrega as configurações armazenadas no arquivo .env
require("dotenv").config();

// Importa a ferramenta Pool da biblioteca pg
// O Pool permite que o Node.js se conecte ao PostgreSQL
const { Pool } = require("pg");

// Configura a conexão com o banco de dados usando os dados do arquivo .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Testa se a conexão com o PostgreSQL está funcionando
pool.query("SELECT NOW()")
  .then(() => {
    console.log("Conexão com o PostgreSQL realizada com sucesso!");
  })
  .catch((erro) => {
    console.error("Erro ao conectar com o PostgreSQL:", erro.message);
  });

// Cria a aplicação usando o Express
const app = express();

// Define que o servidor funcionará na porta 3000
const porta = 3000;

// Permite que a API receba e interprete dados no formato JSON
app.use(express.json());

// Rota usada para verificar se o OS Service está funcionando
app.get("/", (req, res) => {
  res.json({
    mensagem: "OS Service está funcionando!"
  });
});

// Rota que busca todas as ordens de serviço no PostgreSQL
app.get("/ordens", async (req, res) => {
  try {
    // Consulta todas as linhas da tabela ordens e organiza pelo ID
    const resultado = await pool.query(
      "SELECT * FROM ordens ORDER BY id"
    );

    // Devolve a lista de ordens no formato JSON
    res.json(resultado.rows);
  } catch (erro) {
    // Registra o erro no Prompt onde o servidor está rodando
    console.error("Erro ao listar ordens:", erro.message);

    // Devolve o erro HTTP 500 para quem fez a requisição
    res.status(500).json({
      mensagem: "Erro interno ao listar ordens de serviço"
    });
  }
});

// Rota que busca uma ordem específica pelo ID
app.get("/ordens/:id", async (req, res) => {
  // Obtém o ID informado na rota e transforma em número
  const id = Number(req.params.id);

  try {
    // Busca no PostgreSQL a ordem que possui o ID informado
    const resultado = await pool.query(
      "SELECT * FROM ordens WHERE id = $1",
      [id]
    );

    // Se nenhuma ordem for encontrada, devolve o erro HTTP 404
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Ordem de serviço não encontrada"
      });
    }

    // Devolve somente a ordem encontrada
    res.json(resultado.rows[0]);
  } catch (erro) {
    // Registra o erro no Prompt onde o servidor está rodando
    console.error("Erro ao buscar ordem:", erro.message);

    // Devolve o erro HTTP 500 para quem fez a requisição
    res.status(500).json({
      mensagem: "Erro interno ao buscar ordem de serviço"
    });
  }
});

// Rota que cria uma nova ordem de serviço
app.post("/ordens", async (req, res) => {
  // Obtém cliente, veículo e problema enviados na requisição
  const { cliente, veiculo, problema } = req.body;

  // Verifica se todos os campos obrigatórios foram enviados
  if (!cliente || !veiculo || !problema) {
    return res.status(400).json({
      mensagem: "Cliente, veículo e problema são obrigatórios"
    });
  }

  try {
    // Insere a nova ordem na tabela ordens do PostgreSQL
    const resultado = await pool.query(
      `INSERT INTO ordens (cliente, veiculo, problema)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [cliente, veiculo, problema]
    );

    // Devolve a ordem criada com o status HTTP 201
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    // Registra o erro no Prompt onde o servidor está rodando
    console.error("Erro ao criar ordem:", erro.message);

    // Devolve o erro HTTP 500 para quem fez a requisição
    res.status(500).json({
      mensagem: "Erro interno ao criar ordem de serviço"
    });
  }
});

// Rota que atualiza somente o status de uma ordem existente
app.patch("/ordens/:id/status", async (req, res) => {
  // Obtém o ID informado na rota e transforma em número
  const id = Number(req.params.id);

  // Obtém o novo status enviado na requisição
  const { status } = req.body;

  // Impede a atualização quando nenhum status é enviado
  if (!status) {
    return res.status(400).json({
      mensagem: "O novo status é obrigatório"
    });
  }

  // Define os status que podem ser usados no OS Service
  const statusPermitidos = [
    "ABERTA",
    "EM_DIAGNOSTICO",
    "AGUARDANDO_APROVACAO",
    "EM_EXECUCAO",
    "FINALIZADA",
    "CANCELADA"
  ];

  // Verifica se o status recebido está na lista de status permitidos
  if (!statusPermitidos.includes(status)) {
    return res.status(400).json({
      mensagem: "Status inválido",
      statusPermitidos
    });
  }

  try {
    // Atualiza o status da ordem no PostgreSQL
    const resultado = await pool.query(
      `UPDATE ordens
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    // Se nenhuma ordem foi atualizada, significa que o ID não existe
    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensagem: "Ordem de serviço não encontrada"
      });
    }

    // Devolve a ordem com o status atualizado
    res.json(resultado.rows[0]);
  } catch (erro) {
    // Registra o erro no Prompt onde o servidor está rodando
    console.error("Erro ao atualizar status:", erro.message);

    // Devolve o erro HTTP 500 para quem fez a requisição
    res.status(500).json({
      mensagem: "Erro interno ao atualizar o status"
    });
  }
});

// Só sobe o servidor quando o arquivo é executado diretamente
if (require.main === module) {
  app.listen(porta, () => {
    console.log(`OS Service iniciado na porta ${porta}`);
  });
}

// Exporta a aplicação para permitir testes automatizados
module.exports = {
  app,
  pool
};