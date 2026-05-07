from typing import Any, Dict, List
import akshare as ak
import pandas as pd


def process_balance_statement(
    stock_code: str, start_date: str, end_date: str
) -> List[Dict[str, Any]]:
    """
    处理资产负债表相关字段，并获取指定时间范围内的数据，按照指定顺序输出

    Args:
        stock_code: 股票代码
        start_date: 起始日期 (格式: YYYY-MM-DD)
        end_date: 结束日期 (格式: YYYY-MM-DD)

    Returns:
        包含资产负债表字段的列表，每个元素是一个字典
    """
    try:
        # 获取数据
        df = ak.stock_financial_report_sina(stock=stock_code, symbol="资产负债表")

        if df is None or df.empty:
            print("未获取到资产负债表数据。")
            return []

        # 转换报告日期
        df["报告日"] = pd.to_datetime(df["报告日"], format="%Y%m%d", errors="coerce")

        # 筛选时间范围
        mask = (df["报告日"] >= start_date) & (df["报告日"] <= end_date)
        filtered_df = df.loc[mask].copy()

        if filtered_df.empty:
            print("筛选后的数据为空。")
            return []

        # 按报告日期升序排序，以便后续操作
        filtered_df.sort_values(by="报告日", inplace=True)

        # 数据清洗，转换为数值
        numeric_columns = [
            "应收账款",
            "资产总计",
            "预付款项",
            "存货",
            "固定资产及清理合计",
            "无形资产",
            "开发支出",
            "商誉",
            "所有者权益(或股东权益)合计",
            "短期借款",
            "应付短期债券",
            "一年内到期的非流动负债",
            "长期借款",
            "应付债券",
            "租赁负债",
            "生产性生物资产",
            "工程物资",
            "在建工程合计",
            "交易性金融资产",
            "一年内到期的非流动资产",
            "其他流动资产",
        ]

        for col in numeric_columns:
            filtered_df[col] = pd.to_numeric(
                filtered_df[col].astype(str).str.replace(",", "", regex=True),
                errors="coerce",
            ).fillna(0.0)

        # 计算指标
        # 应收账款占总资产比率
        filtered_df["应收账款占总资产比率"] = (
            (filtered_df["应收账款"] / filtered_df["资产总计"])
            .replace([pd.NA, float("inf"), -float("inf")], 0.0)
            .fillna(0.0)
        )

        # 商誉占总资产比率
        filtered_df["商誉占总资产比率"] = (
            (filtered_df["商誉"] / filtered_df["资产总计"])
            .replace([pd.NA, float("inf"), -float("inf")], 0.0)
            .fillna(0.0)
        )

        # 杠杆系数
        filtered_df["杠杆系数"] = (
            (filtered_df["资产总计"] / filtered_df["所有者权益(或股东权益)合计"])
            .replace([pd.NA, float("inf"), -float("inf")], 0.0)
            .fillna(0.0)
        )

        # 有息负债
        filtered_df["有息负债"] = (
            filtered_df["短期借款"]
            + filtered_df["应付短期债券"]
            + filtered_df["一年内到期的非流动负债"]
            + filtered_df["长期借款"]
            + filtered_df["应付债券"]
            + filtered_df["租赁负债"]
        )

        # 有息负债占总资产比率
        filtered_df["有息负债占总资产比率"] = (
            (filtered_df["有息负债"] / filtered_df["资产总计"])
            .replace([pd.NA, float("inf"), -float("inf")], 0.0)
            .fillna(0.0)
        )

        # 生产资产
        filtered_df["生产资产"] = (
            filtered_df["固定资产及清理合计"]
            + filtered_df["无形资产"]
            + filtered_df["开发支出"]
            + filtered_df["生产性生物资产"]
            + filtered_df["工程物资"]
            + filtered_df["在建工程合计"]
        )

        filtered_df["可迅速变现的金融资产"] = (
            filtered_df["交易性金融资产"]
            + filtered_df["一年内到期的非流动资产"]
            + filtered_df["其他流动资产"]
        )

        # 构造结果
        results = []
        for _, row in filtered_df.iterrows():
            # 基础字段
            base_fields = {
                "报告日期": (
                    row["报告日"].strftime("%Y-%m-%d")
                    if not pd.isna(row["报告日"])
                    else ""
                )
            }

            # 添加资产负债表的原始字段
            balance_fields = {
                "应收账款": row["应收账款"],
                "资产总计": row["资产总计"],
                "预付款项": row["预付款项"],
                "存货": row["存货"],
                "固定资产及清理合计": row["固定资产及清理合计"],
                "无形资产": row["无形资产"],
                "开发支出": row["开发支出"],
                "商誉": row["商誉"],
                "所有者权益(或股东权益)合计": row["所有者权益(或股东权益)合计"],
                "交易性金融资产": row["交易性金融资产"],
                "一年内到期的非流动资": row["一年内到期的非流动资产"],
                "其他流动资产": row["其他流动资产"],
            }

            # 计算字段
            indicators = {
                "应收账款占总资产比率": row["应收账款占总资产比率"],
                "商誉占总资产比率": row["商誉占总资产比率"],
                "杠杆系数": row["杠杆系数"],
                "生产资产": row["生产资产"],
                "有息负债": row["有息负债"],
                "可迅速变现的金融资产": row["可迅速变现的金融资产"],
                "有息负债占总资产比率": row["有息负债占总资产比率"],
            }

            # 合并所有字段，按照报告日期 -> 资产负债表字段 -> 计算字段
            ordered_result = {**base_fields, **balance_fields, **indicators}
            results.append(ordered_result)

        # 转换为 DataFrame 并按报告日期排序（降序）
        result_df = pd.DataFrame(results)
        result_df.sort_values(by="报告日期", ascending=False, inplace=True)

        return result_df.to_dict(orient="records")

    except Exception as e:
        print(f"处理数据时出错: {str(e)}")
        return []


# 示例调用
# if __name__ == "__main__":
#     stock_code = "sh600600"
#     start_date = "2014-01-01"
#     end_date = pd.Timestamp.now().strftime("%Y-%m-%d")
#     balance_sheet_data = process_balance_statement(stock_code, start_date, end_date)
#     print(json.dumps(balance_sheet_data, indent=4, ensure_ascii=False))

#     if balance_sheet_data:
#         # 转到 CSV
#         output_file = "/home/seele_vollerei/公共/Code/Python/report_api/balance_sheet_data.csv"
#         pd.DataFrame(balance_sheet_data).to_csv(output_file, index=False)
#         print(f"数据已写入 {output_file}")
#     else:
#         print("没有数据写入 CSV。")
