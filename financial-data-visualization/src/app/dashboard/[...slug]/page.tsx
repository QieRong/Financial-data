// app/dashboard/[...slug]/page.tsx
"use client";
import dynamic from "next/dynamic";
import { use, useMemo } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Suspense } from "react";
import { resolve } from "path";

// 更新 LoadingState 组件
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

// 修改组件映射关系，补全所有组件
const COMPONENT_MAP = {
    reports: {
        "balance-sheet": {
            "current-assets": {
                receivables: () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/current-assets/receivables"
                    ),
                prepayments: () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/current-assets/prepayments"
                    ),
                inventory: () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/current-assets/inventory"
                    ),
            },
            "non-current-assets": {
                "fixed-assets": () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/non-current-assets/fixed-assets"
                    ),
                "intangible-assets": () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/non-current-assets/intangible-assets"
                    ),
                goodwill: () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/non-current-assets/goodwill"
                    ),
            },
            debt: {
                "interest-bearing": () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/debt/interest-bearing"
                    ),
                solvency: () =>
                    import(
                        "@/app/dashboard/_components/analysis/balance-sheet/debt/solvency"
                    ),
            },
        },
        "cash-flow": {
            operating: {
                operating: () =>
                    import(
                        "@/app/dashboard/_components/analysis/cash-flow/operating/operating"
                    ),
            },
            investing: {
                investing: () =>
                    import(
                        "@/app/dashboard/_components/analysis/cash-flow/investing/investing"
                    ),
            },
            financing: {
                financing: () =>
                    import(
                        "@/app/dashboard/_components/analysis/cash-flow/financing/financing"
                    ),
            },
        },
        "income-statement": {
            "revenue-profit": {
                revenue: () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/revenue-profit/revenue"
                    ),
                profit: () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/revenue-profit/profit"
                    ),
                "profit-margin": () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/revenue-profit/profit-margin"
                    ),
            },
            "cost-expense": {
                "total-cost": () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/cost-expense/total-cost"
                    ),
                expenses: () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/cost-expense/expenses"
                    ),
                "expense-ratio": () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/cost-expense/expense-ratio"
                    ),
            },
            "other-income": {
                "non-operating": () =>
                    import(
                        "@/app/dashboard/_components/analysis/income-statement/other-income/non-operating"
                    ),
            },
        },
        comprehensive: {
            index: () => import("@/app/dashboard/reports/comprehensive/page"),
        },
    },
} as const;

// 更新类型定义
type FirstLevel = keyof typeof COMPONENT_MAP;
type SecondLevel<T extends FirstLevel> = keyof (typeof COMPONENT_MAP)[T];
type ThirdLevel<
    T extends FirstLevel,
    U extends SecondLevel<T>
> = keyof (typeof COMPONENT_MAP)[T][U];
type FourthLevel<
    T extends FirstLevel,
    U extends SecondLevel<T>,
    V extends ThirdLevel<T, U>
> = keyof (typeof COMPONENT_MAP)[T][U][V];

// 创建一个包装组件来处理动态导入的组件
function DynamicComponentWrapper({
    Component,
}: {
    Component: React.ComponentType;
}) {
    return (
        <Suspense fallback={<LoadingState />}>
            <Component />
        </Suspense>
    );
}

export default function DynamicPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const DynamicComponent = useMemo(() => {
        const [first, second, third, fourth] = slug;

        // 特殊处理综合分析路由
        if (
            first === "reports" &&
            second === "comprehensive" &&
            third === "index"
        ) {
            return dynamic(
                () => import("@/app/dashboard/_components/analysis/roe"),
                { ssr: false }
            );
        }

        // 验证路径
        if (!first || !second || !third || !fourth) {
            return notFound();
        }

        // 验证每一级路径是否存在
        if (!(first in COMPONENT_MAP)) return notFound();

        const secondLevel = COMPONENT_MAP[first as FirstLevel];
        if (!(second in secondLevel)) return notFound();

        const thirdLevel = secondLevel[second as SecondLevel<FirstLevel>];
        if (!(third in thirdLevel)) return notFound();

        const fourthLevel =
            thirdLevel[
                third as ThirdLevel<FirstLevel, SecondLevel<FirstLevel>>
            ];
        if (!(fourth in fourthLevel)) return notFound();

        // 获取组件
        const Component = fourthLevel[fourth as keyof typeof fourthLevel];
        return dynamic(Component, { ssr: false });
    }, [slug]);

    if (!DynamicComponent) {
        return notFound();
    }

    return <DynamicComponentWrapper Component={DynamicComponent} />;
}
