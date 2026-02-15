import { AssetForm } from "@/components/features/assets/AssetForm";
import { AssetTable } from "@/components/features/assets/AssetTable";

export default function AssetsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
                    <p className="text-muted-foreground hidden md:block">Manage your investment portfolio and track growth.</p>
                </div>
                <AssetForm />
            </div>

            <div className="grid gap-6">
                <div className="glass-card rounded-xl p-1">
                    <AssetTable />
                </div>
            </div>
        </div>
    );
}
