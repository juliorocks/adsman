'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm m-6">
            <div className="h-16 w-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-rose-500" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Ops! Algo deu errado.
            </h2>

            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Ocorreu um erro inesperado. Tente recarregar a página.
            </p>

            {error.digest && (
                <div className="mb-8 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-mono text-slate-500">
                    ID do Erro: {error.digest}
                </div>
            )}

            <div className="flex gap-4">
                <Button
                    onClick={() => reset()}
                    className="gap-2"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Tentar Novamente
                </Button>

                <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                >
                    Recarregar Página
                </Button>
            </div>
        </div>
    );
}
