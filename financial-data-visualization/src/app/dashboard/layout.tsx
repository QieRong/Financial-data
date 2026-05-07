import SidebarContainer from "./_components/SidebarContainer";
import QueryProvider from "@/components/providers/query-provider"
import { Suspense } from "react";

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <QueryProvider>
        <Suspense fallback={children}>
            <SidebarContainer>{children}</SidebarContainer>
        </Suspense>
    </QueryProvider>;
}
