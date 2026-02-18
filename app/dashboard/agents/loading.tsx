
import { AgentsPageSkeleton } from "@/components/dashboard/AgentsPageSkeleton";

export default function Loading() {
    return (
        <div className="p-4 md:p-8">
            <AgentsPageSkeleton />
        </div>
    );
}
