
import { getOpenAIKey } from "@/lib/data/settings";
import OpenAI from "openai";

export default async function TestKeyPage() {
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        log("=== INICIANDO TESTE DE CHAVE OPENAI ===");

        // 1. Recuperar Chave
        const apiKey = await getOpenAIKey();

        if (!apiKey) {
            log("❌ FALHA: Nenhuma chave encontrada no banco ou .env");
        } else {
            const maskedKey = `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}`;
            log(`✅ SUCESSO: Chave recuperada: ${maskedKey}`);

            // 2. Inicializar Cliente
            const openai = new OpenAI({ apiKey });

            // 3. Teste Simples (Modelos)
            try {
                log("🔄 Tentando listar modelos (teste de autenticação)...");
                const list = await openai.models.list();
                log("✅ SUCESSO: Autenticação confirmada.");

                // 4. Teste de Chat (GPT-4)
                try {
                    log("🔄 Tentando gerar resposta com gpt-4-turbo-preview...");
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4-turbo-preview",
                        messages: [{ role: "user", content: "Teste." }],
                        max_tokens: 5
                    });
                    log("✅ SUCESSO: GPT-4 respondeu: " + completion.choices[0].message.content);
                } catch (chatError: any) {
                    log(`❌ FALHA GPT-4: ${chatError.message}`);
                    log(`Código de Erro: ${chatError.code || 'N/A'}`);
                    log(`Tipo de Erro: ${chatError.type || 'N/A'}`);

                    if (chatError.status === 404) {
                        log("💡 DICA: Sua chave pode não ter acesso ao modelo GPT-4. Tente usar uma chave com créditos pré-pagos.");
                    } else if (chatError.status === 429) {
                        log("💡 DICA: Limite de cota excedido ou rate limit.");
                    }
                }

            } catch (authError: any) {
                log(`❌ FALHA DE AUTENTICAÇÃO: ${authError.message}`);
            }
        }

    } catch (sysError: any) {
        log(`❌ ERRO NO SISTEMA: ${sysError.message}`);
    }

    return (
        <div className="p-10 font-mono text-white bg-slate-950 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-blue-400">Diagnóstico de Chave OpenAI</h1>
            <div className="space-y-2 border border-slate-800 p-6 rounded-xl bg-slate-900/50">
                {logs.map((L, i) => (
                    <div key={i} className={`p-2 border-b border-slate-800/50 ${L.includes("❌") ? "text-red-400" : L.includes("✅") ? "text-green-400" : "text-slate-300"}`}>
                        {L}
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-yellow-200 text-sm">
                Nota: Se este teste falhar, sua chave salva no banco está inválida ou expirada, mesmo que o painel mostre "Conectado".
            </div>
        </div>
    );
}
