# AIOS CORE KNOWLEDGE - Journal de Desenvolvimento

Este arquivo serve como a **Memória de Longo Prazo** do projeto. Todo agente AI que trabalhar neste código deve ler este arquivo primeiro para entender decisões passadas, erros resolvidos e arquitetura atual.

---

## 🚀 Integração Google Drive (Fevereiro 2024)

### Objetivo
Permitir o upload de arquivos pesados (como vídeos em 4K) diretamente do Google Drive para o Meta Ads, contornando limites de upload de rede local/Vercel via transferência **Cloud-to-Cloud**.

### 🛠️ Arquitetura e Decisões
1. **OAuth2 Resilience**: Implementado fluxo com `offline_access` e `refresh_tokens` criptografados no banco (Supabase).
2. **Vault de Segurança**: Uso de AES-256-GCM para proteger tokens em repouso.
3. **Cloud Pipeline**: O Meta Ads recebe apenas a URL do arquivo do Drive; a importação ocorre entre os servidores do Google e Meta.

### ❌ Erros Enfrentados e Soluções
1. **URI Mismatch (Erro 400)**: 
   - *Causa*: Erro de digitação na Vercel (`ttps://` em vez de `https://`).
   - *Solução*: Correção manual na Vercel e implementação de `.trim()` no código para evitar espaços.
2. **Perda de Sessão no Redirecionamento (Não autenticado)**:
   - *Causa*: O redirecionamento GET do Google para a Vercel às vezes perdia os cookies de sessão do Supabase.
   - *Solução (OAuth State)*: Passamos o `userId` no parâmetro `state` do Google. No retorno, recuperamos o ID do `state` e usamos a `service_role` (admin) para salvar os tokens no banco, garantindo que a conexão nunca falhe por perda de cookie.
3. **Cache de Renderização (A página não atualizava)**:
   - *Causa*: A Vercel/Next.js mostrava a versão em cache da página de configurações.
   - *Solução*: Adicionado parâmetro `?refresh=[timestamp]` no redirecionamento final para forçar um hard-reload dos dados.
4. **Session Recovery em Server Actions**:
   - *Causa*: `getUser()` falhava em algumas chamadas de Server Action na Vercel.
   - *Solução*: Implementação do helper `getCurrentUserId()` que tenta `getUser()`, depois `getSession()` e, por fim, um fallback para o `dev_session` (cookies manuais).

---

## 📌 Regras de Ouro do Projeto
- **Auth**: Sempre use `getCurrentUserId()` em `lib/data/settings.ts` para garantir compatibilidade entre Prod e Dev.
- **Tokens**: Nunca salve tokens em texto limpo. Use o `encrypt` do `lib/security/vault.ts`.
- **Cloud-to-Cloud**: Para arquivos > 20MB, a preferência é sempre o pipeline via URL, não upload de base64.
