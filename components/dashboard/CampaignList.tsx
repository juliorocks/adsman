
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Campaign {
    id: string;
    name: string;
    status: string;
    created_at: string;
}

export function CampaignList({ campaigns }: { campaigns: Campaign[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get currently selected IDs from URL
    const selectedIds = searchParams.get("campaign_id")?.split(",") || [];

    const toggleCampaign = (id: string) => {
        const params = new URLSearchParams(searchParams.toString());
        let newIds = [...selectedIds];

        if (newIds.includes(id)) {
            newIds = newIds.filter(i => i !== id);
        } else {
            newIds.push(id);
        }

        if (newIds.length > 0) {
            params.set("campaign_id", newIds.join(","));
        } else {
            params.delete("campaign_id");
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            {campaigns.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma campanha encontrada.</p>
            ) : (
                campaigns.map((campaign) => {
                    const isSelected = selectedIds.includes(campaign.id);
                    return (
                        <div
                            key={campaign.id}
                            className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer group ${isSelected
                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50/50'
                                }`}
                            onClick={() => toggleCampaign(campaign.id)}
                        >
                            <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleCampaign(campaign.id)}
                                    className="border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                />
                            </div>

                            <div className={`p-2 rounded-lg mr-3 ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                                <Layers className="h-5 w-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-700'}`}>
                                    {campaign.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${campaign.status === "ACTIVE"
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {campaign.status.toLowerCase()}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        Criada em {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
