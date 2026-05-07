"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    AudioWaveform,
    BadgeCheck,
    Bell,
    BookOpen,
    Bot,
    ChevronRight,
    ChevronsUpDown,
    Command,
    CreditCard,
    Folder,
    Frame,
    GalleryVerticalEnd,
    LogOut,
    Map,
    PieChart,
    Plus,
    Settings2,
    Sparkles,
    SquareTerminal,
    Moon,
    Sun,
    BarChart2,
    LineChart,
    History,
    Star,
    FileText,
    BarChart,
    TrendingUp,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { asRoute } from "@/app/lib/utils";

// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/placeholder.svg?height=32&width=32",
    },
    navMain: [
        {
            title: "经营活动相关",
            url: "/dashboard/reports/cash-flow/operating",
            icon: LineChart,
            items: [
                {
                    title: "经营活动",
                    url: "/dashboard/reports/cash-flow/operating/operating",
                },
            ],
        },
        {
            title: "投资活动相关",
            url: "/dashboard/reports/cash-flow/investing",
            icon: BarChart,
            items: [
                {
                    title: "投资活动",
                    url: "/dashboard/reports/cash-flow/investing/investing",
                },
            ],
        },
        {
            title: "筹资活动相关",
            url: "/dashboard/reports/cash-flow/financing",
            icon: TrendingUp,
            items: [
                {
                    title: "筹资活动",
                    url: "/dashboard/reports/cash-flow/financing/financing",
                },
            ],
        },
    ],
};

const teams = [
    {
        name: "资产负债表",
        icon: CreditCard,
        url: "/dashboard/reports/balance-sheet",
    },
    { name: "现金流量表", icon: Folder, url: "/dashboard/reports/cash-flow" },
    {
        name: "利润表",
        icon: PieChart,
        url: "/dashboard/reports/income-statement",
    },
    {
        name: "综合分析",
        icon: TrendingUp,
        url: "/dashboard/reports/comprehensive",
    },
];

// 首先定义每个报表类别对应的导航数据
const reportNavData = {
    "balance-sheet": [
        {
            title: "流动资产与经营效",
            url: "/dashboard/reports/balance-sheet/current-assets",
            icon: LineChart,
            items: [
                {
                    title: "应收账款相关",
                    url: "/dashboard/reports/balance-sheet/current-assets/receivables",
                },
                {
                    title: "预付账款",
                    url: "/dashboard/reports/balance-sheet/current-assets/prepayments",
                },
                {
                    title: "存货相关",
                    url: "/dashboard/reports/balance-sheet/current-assets/inventory",
                },
            ],
        },
        {
            title: "非流动资产类",
            url: "/dashboard/reports/balance-sheet/non-current-assets",
            icon: BarChart,
            items: [
                {
                    title: "固定资产相关",
                    url: "/dashboard/reports/balance-sheet/non-current-assets/fixed-assets",
                },
                {
                    title: "无形资产及开发支出相关",
                    url: "/dashboard/reports/balance-sheet/non-current-assets/intangible-assets",
                },
                {
                    title: "商誉相关",
                    url: "/dashboard/reports/balance-sheet/non-current-assets/goodwill",
                },
            ],
        },
        {
            title: "债务与偿债能力类",
            url: "/dashboard/reports/balance-sheet/debt",
            icon: TrendingUp,
            items: [
                {
                    title: "有息负债相关",
                    url: "/dashboard/reports/balance-sheet/debt/interest-bearing",
                },
                {
                    title: "偿债能力",
                    url: "/dashboard/reports/balance-sheet/debt/solvency",
                },
            ],
        },
    ],
    "cash-flow": [
        {
            title: "经营活动相关",
            url: "/dashboard/reports/cash-flow/operating",
            icon: LineChart,
            items: [
                {
                    title: "经营活动",
                    url: "/dashboard/reports/cash-flow/operating/operating",
                },
            ],
        },
        {
            title: "投资活动相关",
            url: "/dashboard/reports/cash-flow/investing",
            icon: BarChart,
            items: [
                {
                    title: "投资活动",
                    url: "/dashboard/reports/cash-flow/investing/investing",
                },
            ],
        },
        {
            title: "筹资活动相关",
            url: "/dashboard/reports/cash-flow/financing",
            icon: TrendingUp,
            items: [
                {
                    title: "筹资活动",
                    url: "/dashboard/reports/cash-flow/financing/financing",
                },
            ],
        },
    ],
    "income-statement": [
        {
            title: "收入与利润类",
            url: "/dashboard/reports/income-statement/revenue-profit",
            icon: TrendingUp,
            items: [
                {
                    title: "收入相关",
                    url: "/dashboard/reports/income-statement/revenue-profit/revenue",
                },
                {
                    title: "利润相关",
                    url: "/dashboard/reports/income-statement/revenue-profit/profit",
                },
                {
                    title: "利润率相关",
                    url: "/dashboard/reports/income-statement/revenue-profit/profit-margin",
                },
            ],
        },
        {
            title: "成本与费用类",
            url: "/dashboard/reports/income-statement/cost-expense",
            icon: BarChart,
            items: [
                {
                    title: "营业总成本相关",
                    url: "/dashboard/reports/income-statement/cost-expense/total-cost",
                },
                {
                    title: "费用相关",
                    url: "/dashboard/reports/income-statement/cost-expense/expenses",
                },
                {
                    title: "费用率相关",
                    url: "/dashboard/reports/income-statement/cost-expense/expense-ratio",
                },
            ],
        },
        {
            title: "其他收益类",
            url: "/dashboard/reports/income-statement/other-income",
            icon: PieChart,
            items: [
                {
                    title: "营业外收入",
                    url: "/dashboard/reports/income-statement/other-income/non-operating",
                },
            ],
        },
    ],
    comprehensive: [
        {
            title: "综合分析",
            url: "/dashboard/reports/comprehensive",
            icon: TrendingUp,
            items: [
                {
                    title: "综合分析",
                    url: "/dashboard/reports/comprehensive/index",
                },
            ],
        },
    ],
} as const;

// 修改股票代码验证函数
const validateStockCode = (code: string) => {
    // 支持两种格式：
    // 1. sh/sz + 6位数字
    // 2. 纯6位数字
    const patternWithPrefix = /^(sh|sz)\d{6}$/;
    const patternPureNumber = /^\d{6}$/;
    return patternWithPrefix.test(code) || patternPureNumber.test(code);
};

// 添加获取报表第一个子项的辅助函数
const getFirstSubItem = (reportKey: ReportType): NavSubItem | null => {
    const navData = reportNavData[reportKey];
    if (navData?.[0]?.items?.[0]) {
        return navData[0].items[0];
    }
    return null;
};

// 添加获取股票信息的接口和函数
interface StockInfo {
    code: string;
    name: string;
}

// 修改获取股票信息的函数
const fetchStockInfo = async (stockCode: string): Promise<StockInfo> => {
    try {
        // 只使用纯数字部分
        const codeNumber = stockCode.replace(/\D/g, "");

        // 修改为 HTTP 协议
        const response = await fetch(
            `/api/stocks/${codeNumber}`,
            {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.name === "查询失败") {
            throw new Error("Stock name lookup failed");
        }
        return {
            code: String(data.code ?? stockCode).replace(/\D/g, ""),
            name: data.name,
        };
    } catch (error) {
        throw error;
    }
};

// 定义导航项的类型
interface NavItem {
    title: string;
    url?: string;
    icon?: React.ComponentType<any>;
    items: NavSubItem[];
}

interface NavSubItem {
    title: string;
    url: string;
}

type ReportType = keyof typeof reportNavData;

// 删除之前单独定义的 NAV_DATA，直接使用 reportNavData
const NAV_DATA = reportNavData;

// 添加一个加载状态组件
function LoadingState() {
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

// 添加一个工具函数来转换只读数组
function toMutableNavItems(items: readonly any[]): NavItem[] {
    return items.map((item) => ({
        ...item,
        items: Array.isArray(item.items) ? [...item.items] : [],
    }));
}

function getStockCodeFromSearchParams(params: {
    get(name: string): string | null;
}) {
    return params.get("stock")?.replace(/\D/g, "") || "600519";
}

export default function SidebarContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [activeTeam, setActiveTeam] = React.useState(teams[0]);

    const [currentBreadcrumb, setCurrentBreadcrumb] = React.useState({
        group: "分析链",
        item: "",
        subItem: "",
    });

    const [theme, setTheme] = React.useState<"light" | "dark">("light");

    // 从路径中取报表类型并获取对应的导航数据
    const [currentNavData, setCurrentNavData] = React.useState<NavItem[]>(
        () => {
            const initialData = NAV_DATA["balance-sheet"];
            return toMutableNavItems(initialData);
        }
    );

    const reportType = React.useMemo(() => {
        const match = pathname.match(/\/dashboard\/reports\/([^\/]+)/);
        return (match ? match[1] : "comprehensive") as ReportType;
    }, [pathname]);

    // 当 reportType 改变时更新 currentNavData
    React.useEffect(() => {
        const newData = NAV_DATA[reportType];
        setCurrentNavData(toMutableNavItems(newData));
    }, [reportType]);

    const stockCodeFromUrl = getStockCodeFromSearchParams(searchParams);
    const [stockCode, setStockCode] = React.useState(stockCodeFromUrl);

    React.useEffect(() => {
        if (stockCodeFromUrl.length === 6) {
            setStockCode(stockCodeFromUrl);
        }
    }, [stockCodeFromUrl]);

    const routeWithStock = React.useCallback(
        (url: string, nextStockCode = stockCode) => {
            const newParams = new URLSearchParams(searchParams.toString());
            const normalizedStockCode = nextStockCode.replace(/\D/g, "");

            if (normalizedStockCode.length === 6) {
                newParams.set("stock", normalizedStockCode);
            }

            const query = newParams.toString();
            return asRoute(query ? `${url}?${query}` : url);
        },
        [searchParams, stockCode]
    );

    // 使用 useQuery 获取股票信息
    const {
        data: stockInfo,
        isLoading,
        error,
        isError,
    } = useQuery({
        queryKey: ["stockInfo", stockCode],
        queryFn: () => fetchStockInfo(stockCode),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: 3,
        enabled: stockCode.length === 6, // 只在股票代码长度为6时才查询
    });

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
    };

    const handleNavigation = (url: string, item?: NavItem) => {
        if (item && item.items?.length > 0) {
            // 如果是父级菜单项，导航到第一个子项
            const firstSubItem = item.items[0];
            setCurrentBreadcrumb({
                group: activeTeam.name,
                item: item.title,
                subItem: firstSubItem.title,
            });
            router.push(routeWithStock(firstSubItem.url));
        } else {
            // 如果是子菜单项，直接导航
            router.push(routeWithStock(url));
        }
    };

    // 添加自动导航逻辑
    React.useEffect(() => {
        if (pathname === "/dashboard") {
            // 获取第一��报表的第一个导航项的第一个子项
            const firstTeam = teams[0];
            const firstNavItem = data.navMain[0];
            const firstSubItem = firstNavItem.items[0];

            // 设置激活的报表
            setActiveTeam(firstTeam);

            // 更新面包屑
            setCurrentBreadcrumb({
                group: "分析链",
                item: firstNavItem.title,
                subItem: firstSubItem.title,
            });

            // 导航到目标路径
            router.push(routeWithStock(firstSubItem.url));
        }
    }, [pathname, routeWithStock, router]);

    const handleTeamChange = (team: (typeof teams)[0]) => {
        setActiveTeam(team);
        const reportKey = team.url.split("/").pop() as ReportType;
        const newData = NAV_DATA[reportKey];
        setCurrentNavData(toMutableNavItems(newData));

        // 获取第一个导航项和子项
        const firstNavItem = newData[0];
        const firstSubItem = firstNavItem?.items?.[0];

        if (firstSubItem) {
            // 更新面包屑
            setCurrentBreadcrumb({
                group: team.name,
                item: firstNavItem.title,
                subItem: firstSubItem.title,
            });

            // 导航到第一个子项
            router.push(routeWithStock(firstSubItem.url));
        }
    };

    const renderLink = (url: string, children: React.ReactNode) => (
        <Link href={routeWithStock(url) as unknown as URL}>{children}</Link>
    );

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    >
                                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                            <activeTeam.icon className="size-4" />
                                        </div>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">
                                                {activeTeam.name}
                                            </span>
                                            <span className="truncate text-xs"></span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    align="start"
                                    side="bottom"
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                                        财报
                                    </DropdownMenuLabel>
                                    {teams.map((team, index) => (
                                        <DropdownMenuItem
                                            key={team.name}
                                            onClick={() => {
                                                setActiveTeam(team);
                                                // 获取报表类别的 key
                                                const reportKey = team.url
                                                    .split("/")
                                                    .pop() as keyof typeof reportNavData;
                                                // 更新导航数据
                                                const newNavData =
                                                    reportNavData[reportKey];
                                                setCurrentNavData(
                                                    toMutableNavItems(
                                                        newNavData
                                                    )
                                                );

                                                // 获取第一个导航项和子项
                                                const firstNavItem =
                                                    newNavData[0];
                                                const firstSubItem =
                                                    firstNavItem.items[0];

                                                // 更新面包屑
                                                setCurrentBreadcrumb({
                                                    group: "分析链",
                                                    item: firstNavItem.title,
                                                    subItem: firstSubItem.title,
                                                });

                                                // 导航到第一个子项
                                                router.push(
                                                    routeWithStock(
                                                        firstSubItem.url
                                                    )
                                                );
                                            }}
                                            className="gap-2 p-2"
                                        >
                                            <div className="flex size-6 items-center justify-center rounded-sm border">
                                                <team.icon className="size-4 shrink-0" />
                                            </div>
                                            {team.name}
                                            <DropdownMenuShortcut>
                                                ⌘{index + 1}
                                            </DropdownMenuShortcut>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>
                <SidebarContent className="flex flex-col justify-center flex-1">
                    <SidebarGroup>
                        <SidebarGroupLabel>
                            <BarChart2 className="mr-2 h-4 w-4 inline-block" />
                            分析链
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {Array.isArray(currentNavData) &&
                                currentNavData.map((item) => (
                                    <Collapsible
                                        key={item.title}
                                        asChild
                                        className="group/collapsible"
                                    >
                                        <SidebarMenuItem>
                                            <CollapsibleTrigger asChild>
                                                <SidebarMenuButton
                                                    tooltip={item.title}
                                                    onClick={() =>
                                                        handleNavigation(
                                                            item.url || "",
                                                            item
                                                        )
                                                    }
                                                >
                                                    {item.icon && (
                                                        <item.icon className="mr-2 h-4 w-4" />
                                                    )}
                                                    <span>{item.title}</span>
                                                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                </SidebarMenuButton>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent>
                                                <SidebarMenuSub>
                                                    {item.items?.map(
                                                        (subItem) => (
                                                            <SidebarMenuSubItem
                                                                key={
                                                                    subItem.title
                                                                }
                                                            >
                                                                <SidebarMenuSubButton
                                                                    asChild
                                                                    // Start of Selection
                                                                >
                                                                    <Link
                                                                        href={routeWithStock(
                                                                            subItem.url
                                                                        )}
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.preventDefault();
                                                                            handleNavigation(
                                                                                subItem.url
                                                                            );
                                                                            setCurrentBreadcrumb(
                                                                                {
                                                                                    group: activeTeam.name,
                                                                                    item: item.title,
                                                                                    subItem:
                                                                                        subItem.title,
                                                                                }
                                                                            );
                                                                        }}
                                                                    >
                                                                        <span>
                                                                            {
                                                                                subItem.title
                                                                            }
                                                                        </span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        )
                                                    )}
                                                </SidebarMenuSub>
                                            </CollapsibleContent>
                                        </SidebarMenuItem>
                                    </Collapsible>
                                ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    >
                                        <Avatar className="h-8  w-8 rounded-lg">
                                            <AvatarImage
                                                src={data.user.avatar}
                                                alt={data.user.name}
                                            />
                                            <AvatarFallback className="rounded-lg">
                                                CN
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">
                                                {data.user.name}
                                            </span>
                                            <span className="truncate text-xs">
                                                {data.user.email}
                                            </span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8  w-8 rounded-lg">
                                                <AvatarImage
                                                    src={data.user.avatar}
                                                    alt={data.user.name}
                                                />
                                                <AvatarFallback className="rounded-lg">
                                                    CN
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">
                                                    {data.user.name}
                                                </span>
                                                <span className="truncate text-xs">
                                                    {data.user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            <Settings2 className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem>
                                            <Bell className="mr-2 h-4 w-4" />
                                            Notifications
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <BreadcrumbLink
                                                href="#"
                                                className="flex items-center"
                                            >
                                                {activeTeam.icon && (
                                                    <activeTeam.icon className="mr-2 h-4 w-4" />
                                                )}
                                                {activeTeam.name}
                                            </BreadcrumbLink>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {teams.map((team) => (
                                                <DropdownMenuItem
                                                    key={team.name}
                                                    onClick={() => {
                                                        setActiveTeam(team);
                                                        const reportKey =
                                                            team.url
                                                                .split("/")
                                                                .pop() as keyof typeof reportNavData;
                                                        const newNavData =
                                                            reportNavData[
                                                                reportKey
                                                            ];
                                                        setCurrentNavData(
                                                            toMutableNavItems(
                                                                newNavData
                                                            )
                                                        );

                                                        // 获取第一个导航项和子项
                                                        const firstNavItem =
                                                            newNavData[0];
                                                        const firstSubItem =
                                                            firstNavItem
                                                                .items[0];

                                                        // 更新面包屑
                                                        setCurrentBreadcrumb({
                                                            group: team.name,
                                                            item: firstNavItem.title,
                                                            subItem:
                                                                firstSubItem.title,
                                                        });

                                                        // 导航到第一个子项
                                                        router.push(
                                                            routeWithStock(
                                                                firstSubItem.url
                                                            )
                                                        );
                                                    }}
                                                >
                                                    <team.icon className="mr-2 h-4 w-4" />
                                                    {team.name}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />

                                <BreadcrumbItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <BreadcrumbLink href="#">
                                                {currentBreadcrumb.item}
                                            </BreadcrumbLink>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {currentNavData.map((item) => (
                                                <DropdownMenuItem
                                                    key={item.title}
                                                    onClick={() => {
                                                        if (
                                                            item.items &&
                                                            item.items.length >
                                                                0
                                                        ) {
                                                            const firstSubItem =
                                                                item.items[0];
                                                            setCurrentBreadcrumb(
                                                                {
                                                                    group: activeTeam.name,
                                                                    item: item.title,
                                                                    subItem:
                                                                        firstSubItem.title,
                                                                }
                                                            );
                                                            router.push(
                                                                routeWithStock(
                                                                    firstSubItem.url
                                                                )
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {item.icon && (
                                                        <item.icon className="mr-2 h-4 w-4" />
                                                    )}
                                                    {item.title}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </BreadcrumbItem>

                                {currentBreadcrumb.subItem && (
                                    <>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <BreadcrumbLink href="#">
                                                        {
                                                            currentBreadcrumb.subItem
                                                        }
                                                    </BreadcrumbLink>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    {currentNavData
                                                        .find(
                                                            (item) =>
                                                                item.title ===
                                                                currentBreadcrumb.item
                                                        )
                                                        ?.items.map(
                                                            (subItem) => (
                                                                <DropdownMenuItem
                                                                    key={
                                                                        subItem.title
                                                                    }
                                                                    onClick={() => {
                                                                        setCurrentBreadcrumb(
                                                                            {
                                                                                group: activeTeam.name,
                                                                                item: currentBreadcrumb.item,
                                                                                subItem:
                                                                                    subItem.title,
                                                                            }
                                                                        );
                                                                        router.push(
                                                                            routeWithStock(
                                                                                subItem.url
                                                                            )
                                                                        );
                                                                    }}
                                                                >
                                                                    {
                                                                        subItem.title
                                                                    }
                                                                </DropdownMenuItem>
                                                            )
                                                        )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </BreadcrumbItem>
                                    </>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center gap-4 px-4">
                        <Input
                            type="search"
                            placeholder="输入股票代码(如:600519)..."
                            className="w-[200px] md:w-[300px]"
                            value={stockCode}
                            onChange={(e) => {
                                const newValue = e.target.value.replace(
                                    /\D/g,
                                    ""
                                );
                                setStockCode(newValue);
                            }}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    stockCode.length === 6
                                ) {
                                    router.push(
                                        routeWithStock(
                                            pathname,
                                            stockCode
                                        ) as any
                                    );
                                }
                            }}
                        />
                        {isLoading && (
                            <span className="text-sm text-gray-500">
                                加载中...
                            </span>
                        )}
                        {isError && (
                            <span className="text-sm text-red-500">
                                查询失败 ({stockCode})
                            </span>
                        )}
                        {!isError && stockInfo && (
                            <div className="text-sm">
                                <span className="font-medium">
                                    {stockInfo.name}
                                </span>
                                <span className="text-gray-500 ml-2">
                                    ({stockInfo.code})
                                </span>
                            </div>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleTheme}
                        >
                            {theme === "light" ? (
                                <Moon className="h-[1.2rem] w-[1.2rem]" />
                            ) : (
                                <Sun className="h-[1.2rem] w-[1.2rem]" />
                            )}
                        </Button>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
