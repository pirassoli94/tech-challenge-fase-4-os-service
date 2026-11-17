# OS Service — Tech Challenge FIAP Fase 4

## Visão geral
Microsserviço responsável pelo gerenciamento das ordens de serviço de uma oficina mecânica.

Tecnologias: Node.js, Express, PostgreSQL, Docker e Kubernetes.

## Arquitetura
O OS Service mantém as ordens de serviço em um banco PostgreSQL independente.

Integra-se ao fluxo distribuído da oficina por meio de APIs REST. O Billing Service gerencia orçamentos e pagamentos, enquanto o Execution Service gerencia diagnósticos e reparos.

## Saga Pattern
O projeto utiliza uma abordagem híbrida, combinando comunicação HTTP e eventos assíncronos pelo RabbitMQ.

No fluxo de sucesso, após a conclusão do reparo, o Execution Service chama a API do OS Service para atualizar a ordem para FINALIZADA.

No fluxo de compensação, uma falha na execução provoca o cancelamento da ordem de serviço. O Billing Service também recebe um evento de falha para iniciar o cancelamento do pagamento.

O cancelamento financeiro é representado pelo status CANCELAMENTO_PENDENTE; não equivale a um estorno efetivamente realizado.

## API
Porta padrão: 3000.

Principais operações:
- POST /ordens — criar ordem de serviço.
- GET /ordens/:id — consultar ordem.
- PATCH /ordens/:id/status — atualizar status.

A collection Postman está disponível no diretório postman/.

## Execução local
Instalar dependências: npm ci

Executar testes: npm run test:coverage

Iniciar aplicação: node index.js

## Docker
Construir imagem: docker build -t os-service:1.0 .

## Kubernetes
Os manifestos estão no diretório k8s/.

O serviço foi validado em um cluster Kubernetes local utilizando Docker Desktop.

## Testes e qualidade
Os testes automatizados utilizam Jest, com cobertura mínima de 80% verificada pelo pipeline.

O projeto utiliza SonarQube Cloud para análise de qualidade.

O relatório de cobertura está disponível no arquivo cobertura-os.txt.

## CI/CD
O workflow .github/workflows/ci-cd.yml executa instalação de dependências, testes automatizados, análise SonarQube, publicação de cobertura e build Docker.

O job de deploy Kubernetes depende da configuração do segredo KUBE_CONFIG no GitHub Actions.

## Observabilidade
O serviço disponibiliza métricas pela rota GET /metrics e utiliza logs estruturados para auxiliar o monitoramento.

## Segurança
Arquivos de ambiente, credenciais, tokens e dependências instaladas não devem ser publicados no repositório.
