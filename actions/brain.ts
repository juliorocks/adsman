
'use server';

import { saveBusinessContext, deleteBusinessContext } from "@/lib/data/brain";
import { revalidatePath } from "next/cache";

export async function addBusinessFact(formData: FormData) {
    const content = formData.get('content') as string;
    const category = formData.get('category') as any;

    if (!content || !category) throw new Error("Missing fields");

    await saveBusinessContext(content, category);
    revalidatePath('/dashboard/brain');
}

export async function removeBusinessFact(id: string) {
    await deleteBusinessContext(id);
    revalidatePath('/dashboard/brain');
}
