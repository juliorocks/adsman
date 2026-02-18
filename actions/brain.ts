
'use server';

import { saveBusinessContext, deleteBusinessContext } from "@/lib/data/brain";
import { revalidatePath } from "next/cache";

export async function addBusinessFact(formData: FormData) {
    const content = formData.get('content') as string;
    const category = formData.get('category') as any;

    if (!content || !category) throw new Error("Missing fields");

    console.log("[Brain Action] Adding fact:", { content, category });

    try {
        await saveBusinessContext(content, category);
        revalidatePath('/dashboard/brain');
    } catch (error) {
        console.error("[Brain Action] Error adding fact:", error);
        throw error;
    }
}

export async function removeBusinessFact(id: string) {
    await deleteBusinessContext(id);
    revalidatePath('/dashboard/brain');
}
