import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
    return (
        <Card className="w-full">
            <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-2/5" />
                    <Skeleton className="h-10 w-[200px]" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-2">
                        <div className="h-[400px] relative">
                            <Skeleton className="h-full w-full" />
                        </div>
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
