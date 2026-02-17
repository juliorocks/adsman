
# Guia de Configuração "Vida Real" (Produção)

Para conectar seu aplicativo aos serviços reais da Meta e Supabase, siga estes passos:

## 1. Configurar Supabase (Banco de Dados)
Já identificamos seu projeto `MetaAdsIA`.

1.  Acesse o Painel do Supabase: [https://supabase.com/dashboard/project/sisydugbdmlsqvgikpyd/settings/api](https://supabase.com/dashboard/project/sisydugbdmlsqvgikpyd/settings/api)
2.  Copie a **`service_role` secret** (chave secreta).
3.  Cole no arquivo `.env` na variável `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Configurar Meta (Facebook Developers)
1.  Acesse [Developers.facebook.com](https://developers.facebook.com/).
2.  Crie um novo App (Tipo: "Empresa" ou "Outro" > "Marketing API").
3.  Vá em **Configurações > Básico**.
4.  Copie o **ID do App** e cole em `META_APP_ID` no `.env`.
5.  Copie a **Chave Secreta do App** e cole em `META_APP_SECRET` no `.env`.
6.  Vá em **Produtos > Login do Facebook > Configurações**.
7.  Adicione `http://localhost:3006/api/auth/meta/callback` em "URIs de Redirecionamento do OAuth Válidos".

## 3. Checklist Final
Após atualizar o arquivo `.env`:
- [x] `NEXT_PUBLIC_SUPABASE_URL` 
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Sua ação necessária ⚠️)
- [ ] `META_APP_ID` (Sua ação necessária ⚠️)
- [ ] `META_APP_SECRET` (Sua ação necessária ⚠️)

Reinicie o servidor (`npm run dev`) após salvar o arquivo.
