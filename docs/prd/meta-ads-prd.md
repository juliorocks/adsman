# Documento de Requisitos do Produto (PRD) - Integração com Meta Ads

## Objetivos e Contexto

### Objetivos
- Permitir o gerenciamento contínuo de campanhas do Meta Ads (Facebook/Instagram) diretamente na plataforma AIOS.
- Automatizar o upload de criativos e a configuração de conjuntos de anúncios via Meta Graph API.
- Fornecer rastreamento de desempenho em tempo real e relatórios para tomada de decisões de marketing.
- Implementar autenticação segura e gerenciamento de permissões para ativos do Meta.

### Contexto
O projeto requer uma maneira centralizada de lidar com esforços de marketing, especificamente visando Meta Ads. Atualmente, não há integração, exigindo que os usuários alternem entre plataformas. Integrar o Meta Ads na estrutura AIOS permitirá iterações mais rápidas, otimizações baseadas em IA e visualização de dados consolidada.

### Histórico de Mudanças
| Data | Versão | Descrição | Autor |
|------|---------|-------------|--------|
| 16/02/2026 | 1.0 | PRD inicial para Integração com Meta Ads (Tradução PT-BR) | Morgan (PM) |
| 16/02/2026 | 1.1 | Adição de Motor de Otimização IA e Estúdio Criativo Generativo | Morgan (PM) |
| 16/02/2026 | 1.2 | Refinamento para "Smart Ad Creator" (Fluxo Simplificado) | Morgan (PM) |

## Requisitos

### Funcionais
1. **RF1: Autenticação e Autorização** - O sistema deve suportar fluxo OAuth2 para conectar Contas de Negócios do Meta.
2. **RF2: Gerenciamento Inteligente de Campanhas** - Usuários podem criar campanhas via "Modo Smart" (input mínimo) ou "Modo Avançado".
3. **RF3: Configuração Automática de Ad Sets** - A IA deve sugerir/configurar automaticamente segmentação, orçamento e bidding com base no objetivo.
4. **RF4: Upload Simplificado** - Drag-and-drop de criativos; IA analisa e sugere melhorias antes do upload.
5. **RF5: Dashboard de Desempenho** - Métricas em tempo real (Impressões, Cliques, CTR, CPC, ROAS).
6. **RF6: Integração com Webhook** - Receber atualizações em tempo real do Meta sobre status do anúncio ou violações de política.
7. **RF7: Motor de Otimização IA (24/7)** - Monitoramento contínuo de KPIs (CPA, ROAS). Execução de regras automáticas (pausar se baixo desempenho, escalar se alto ROAS).
8. **RF8: Estúdio Criativo Generativo** - Geração de copy (títulos, textos principais) e imagens via IA (ex: OpenAI/DALL-E ou similar).

### Funcionalidades de IA (Detalhamento)
- **IA Configuradora (Smart Setup):**
    - **Análise de Input:** Usuário insere "Vender sapatos femininos no RJ" -> IA define Geolocation: Rio de Janeiro, Interests: Shoes, Gender: Female.
    - **Orçamento Inteligente:** Sugere budget diário ideal com base no benchmark do setor.
- **IA Otimizadora:**
    - **Regra de Pausa:** Se CPA > Meta X por Y horas, pausar Ad Set.
    - **Regra de Escala:** Se ROAS > Meta Z, aumentar orçamento em W%.
    - **Regra de Teste:** Criar variantes A/B automaticamente.
- **IA Generativa:**
    - **Copywriter:** Sugerir 5 variações de títulos com base no nicho e dor do cliente.
    - **Designer:** Gerar variações de background ou imagens completas para anúncios.

### Não Funcionais
1. **RNF1: Segurança** - Todos os tokens de acesso devem ser criptografados em repouso.
2. **RNF2: Escalabilidade** - O sistema deve lidar com altos volumes de chamadas de API sem exceder os limites de taxa do Meta (implementando filas/controle de fluxo).
3. **RNF3: Observabilidade** - Log detalhado de interações da API para solução de problemas.

## Objetivos de Design de Interface do Usuário

### Visão Geral de UX
Prioridade total na **Simplicidade**. O usuário deve sentir que está conversando com um estrategista de marketing, não preenchendo formulários complexos. "Menos cliques, mais inteligência".

### Telas e Visualizações Principais
- **Smart Campaign Wizard:** Interface de chat ou formulário minimalista onde o usuário diz o objetivo e sobe os criativos. A IA preenche o resto.
- **Dashboard de Visão Geral de Anúncios:** Métricas de alto nível e lista de campanhas.
- **Review & Approve:** Tela onde o usuário apenas aprova ou ajusta o que a IA sugeriu antes de publicar.
- **Gerenciador de Ativos:** Biblioteca para ativos criativos sincronizados.
- **Página de Configurações/Integração:** Conexão OAuth e status de permissão.

### Dispositivo e Plataformas Alvo
Web Responsivo (Desktop otimizado para tarefas de gerenciamento).

## Premissas Técnicas

### Estrutura do Repositório
Monorepo (Estrutura de projeto existente).

### Arquitetura de Serviço
Funções Serverless (Edge Functions) como a interface principal para chamadas da API do Meta.

### Requisitos de Teste
Testes Unitários + Integração para todos os wrappers de API e lógica de processamento de dados.

## Lista de Épicos

- **Épico 1: Fundação e Autenticação:** Configurar credenciais do App Meta, fluxo OAuth2 e infraestrutura de gerenciamento de tokens.
- **Épico 2: Integração Principal da API:** Implementar operações CRUD de campanha e conjunto de anúncios via Graph API.
- **Épico 3: Gerenciamento de Criativos e Anúncios:** Lidar com uploads de ativos e lógica de criação de anúncios.
- **Épico 4: Desempenho e Relatórios:** Construir o motor de métricas e visualizações do dashboard.
- **Épico 5: Sincronização em Tempo Real e Webhooks:** Implementar webhooks para atualizações de status ao vivo.
- **Épico 6: Motor de Otimização IA:** Implementar lógica de regras automáticas (pausar/escalar) e job runner 24/7.
- **Épico 7: Estúdio Criativo Generativo:** Integrar APIs de IA (LLM/Image Gen) para criação de ativos.

## Próximos Passos
- **Prompt para Especialista em UX:** Revisar este PRD para projetar os fluxos do Dashboard de Anúncios e Criador de Campanhas.
- **Prompt para Arquiteto:** Propor a arquitetura técnica para armazenamento criptografado de tokens e a camada de abstração da API do Meta usando Edge Functions.
