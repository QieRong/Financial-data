import SidebarContainer from "./_components/SidebarContainer";
import QueryProvider from "@/components/providers/query-provider"

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <QueryProvider>
        <SidebarContainer>{children}</SidebarContainer>
    </QueryProvider>;
}
