"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/data/settings";
import { revalidatePath } from "next/cache";

export async function getKnowledgeBases() {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("knowledge_bases")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching knowledge bases:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error("Failed to get knowledge bases", e);
        return [];
    }
}

export async function createKnowledgeBase(formData: FormData) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        const client_name = formData.get("client_name")?.toString();
        const name = formData.get("name")?.toString();
        const content = formData.get("content")?.toString();

        if (!client_name || !name) {
            return { success: false, error: "Nome do cliente e nome da base são obrigatórios." };
        }

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("knowledge_bases")
            .insert({
                user_id: userId,
                client_name,
                name,
                content: content || ""
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating knowledge base:", error);
            return { success: false, error: "Falha ao gravar no banco de dados." };
        }

        revalidatePath("/dashboard/knowledge");
        return { success: true, data };
    } catch (e: any) {
        console.error("Failed to create knowledge base", e);
        return { success: false, error: e.message };
    }
}

export async function deleteKnowledgeBase(id: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        const supabase = await createClient();
        const { error } = await supabase
            .from("knowledge_bases")
            .delete()
            .match({ id, user_id: userId });

        if (error) {
            console.error("Error deleting knowledge base:", error);
            return { success: false, error: "Falha ao apagar." };
        }

        revalidatePath("/dashboard/knowledge");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getKnowledgeBaseById(id: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return null;

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("knowledge_bases")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();

        if (error) {
            console.error("Error fetching knowledge base by id:", error);
            return null;
        }

        return data;
    } catch (e) {
        console.error("Failed to get knowledge base by id", e);
        return null;
    }
}

export async function updateKnowledgeBase(id: string, formData: FormData) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        const content = formData.get("content")?.toString();

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("knowledge_bases")
            .update({ content: content || "", updated_at: new Date().toISOString() })
            .match({ id, user_id: userId })
            .select()
            .single();

        if (error) {
            console.error("Error updating knowledge base:", error);
            return { success: false, error: "Falha ao atualizar no banco de dados." };
        }

        revalidatePath(`/dashboard/knowledge`);
        revalidatePath(`/dashboard/knowledge/${id}`);
        return { success: true, data };
    } catch (e: any) {
        console.error("Failed to update knowledge base", e);
        return { success: false, error: e.message };
    }
}

export async function getKnowledgeSources(knowledgeBaseId: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("knowledge_sources")
            .select("*")
            .eq("knowledge_base_id", knowledgeBaseId)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching knowledge sources:", error);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error("Failed to get knowledge sources", e);
        return [];
    }
}

export async function addKnowledgeSource(
    knowledgeBaseId: string,
    sourceType: 'GOOGLE_DRIVE' | 'URL' | 'TEXT',
    sourceRef: string,
    metadata: any = {}
) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        const supabase = await createClient();
        const { data, error } = await supabase
            .from("knowledge_sources")
            .insert({
                knowledge_base_id: knowledgeBaseId,
                user_id: userId,
                source_type: sourceType,
                source_ref: sourceRef,
                metadata: metadata,
                sync_status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding knowledge source:", error);
            return { success: false, error: "Falha ao vincular fonte." };
        }

        revalidatePath(`/dashboard/knowledge/${knowledgeBaseId}`);
        return { success: true, data };
    } catch (e: any) {
        console.error("Failed to add knowledge source", e);
        return { success: false, error: e.message };
    }
}

export async function deleteKnowledgeSource(id: string, knowledgeBaseId: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        const supabase = await createClient();
        const { error } = await supabase
            .from("knowledge_sources")
            .delete()
            .match({ id, user_id: userId });

        if (error) {
            console.error("Error deleting knowledge source:", error);
            return { success: false, error: "Falha ao apagar." };
        }

        revalidatePath(`/dashboard/knowledge/${knowledgeBaseId}`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function triggerKnowledgeSync(knowledgeBaseId: string) {
    try {
        const userId = await getCurrentUserId();
        if (!userId) return { success: false, error: "Usuário não autenticado." };

        const supabase = await createClient();
        const { data, error } = await supabase.functions.invoke("sync-knowledge");

        if (error) {
            console.error("Error triggering sync:", error);
            return { success: false, error: "Falha ao acionar sincronização." };
        }

        revalidatePath(`/dashboard/knowledge/${knowledgeBaseId}`);
        return { success: true, message: data?.message || "Sync iniciado" };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
