import { getAvailableAdAccounts } from "@/lib/data/settings";
import { selectAdAccount } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SelectAccountPage() {
    const accounts = await getAvailableAdAccounts();

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Selecione a Conta de Anúncios</CardTitle>
                    <CardDescription>Qual conta você deseja gerenciar nesta plataforma?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!accounts || accounts.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-4">
                            Nenhuma conta encontrada. Verifique se você tem permissão de administrador no Business Manager.
                        </div>
                    ) : (
                        accounts.map((account) => (
                            <form key={account.id} action={selectAdAccount.bind(null, account.id)}>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-auto py-3 px-4"
                                    type="submit"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-slate-900">{account.name}</span>
                                        <span className="text-xs text-slate-500">ID: {account.account_id} • {account.currency}</span>
                                    </div>
                                    <CheckCircle2 className="h-4 w-4 text-slate-300" />
                                </Button>
                            </form>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
