
"use client";

import { useState } from "react";
import { SmartInputStep } from "@/components/wizard/SmartInputStep";
import { AIReviewStep } from "@/components/wizard/AIReviewStep";
import { createCampaign } from "@/actions/campaigns";
import { useRouter } from "next/navigation";
import { StrategyResult } from "@/lib/ai/simulator";

export default function CreateCampaignPage() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<StrategyResult | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const router = useRouter();

    const handleNext = (inputData: any) => {
        setData(inputData);
        setStep(2);
    };

    const handlePublish = async () => {
        if (!data) return;
        setIsPublishing(true);

        // Prepare FormData for Server Action
        const formData = new FormData();
        formData.append("name", `Campanha Smart - ${new Date().toLocaleDateString()}`);
        formData.append("objective", data.objective);
        formData.append("budget", data.budget.toString());
        formData.append("targeting", JSON.stringify(data.targeting));

        const result = await createCampaign(null, formData);

        setIsPublishing(false);

        if (result?.success) {
            alert("Campanha criada com sucesso! 🚀");
            router.push("/dashboard");
        } else {
            alert("Erro ao criar campanha.");
        }
    };

    return (
        <div className="h-full flex items-center justify-center">
            {step === 1 && <SmartInputStep onNext={handleNext} />}
            {step === 2 && data && (
                <AIReviewStep
                    onPublish={handlePublish}
                    onBack={() => setStep(1)}
                    data={data}
                    isPublishing={isPublishing}
                />
            )}
        </div>
    );
}
