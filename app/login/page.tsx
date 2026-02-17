"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { loginDev } from "@/actions/auth";

export default function LoginPage() {
    const router = useRouter();

    const handleDevLogin = async () => {
        // Calling Server Action directly
        await loginDev();
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-950">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-white">Login de Desenvolvimento</h1>
                <p className="text-slate-400">Clique abaixo para entrar como usuário de teste.</p>
                <Button onClick={handleDevLogin} className="w-full">
                    Entrar no Sistema
                </Button>
            </div>
        </div>
    );
}
