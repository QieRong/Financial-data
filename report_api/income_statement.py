import akshare as ak
import pandas as pd
import json
from typing import List, Dict, Any

def process_income_statement(stock_code: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    处理利润表数据并计算指定字段和指标，支持筛选指定日期范围
    
    Args:
        stock_code: 股票代码
        start_date: 起始日期 (格式: YYYY-MM-DD)
        end_date: 结束日期 (格式: YYYY-MM-DD)
    
    Returns:
        包含利润表数据的列表，每个元素是一个字典
    """
    try:
        # 获取利润表数据
        df = ak.stock_financial_report_sina(stock=stock_code, symbol="利润表")

        if df is None or df.empty:
            print("未获取到利润表数据。")
            return []

        # 转换报告日期为标准格式
        df["报告日"] = pd.to_datetime(df["报告日"], format="%Y%m%d", errors="coerce")

        # 筛选指定日期范围
        mask = (df["报告日"] >= start_date) & (df["报告日"] <= end_date)
        filtered_df = df.loc[mask].copy()

        if filtered_df.empty:
            print("筛选后的数据为空。")
            return []

        # 按报告日期升序排序，以便后续操作
        filtered_df.sort_values(by="报告日", inplace=True)

        # 数据清洗，转换为数值
        numeric_columns = [
            "营业收入", "营业总收入", "营业总成本", "营业成本", "销售费用", "管理费用",
            "研发费用", "财务费用", "营业利润", "净利润", "营业外收入", "利润总额", "所得税费用"
        ]
        for col in numeric_columns:
            filtered_df[col] = pd.to_numeric(
                filtered_df[col].astype(str).str.replace(',', '', regex=True), 
                errors='coerce'
            ).fillna(0.0)

        # 计算指标
        # 毛利润 = 营业总收入 - 营业成本
        filtered_df["毛利润"] = filtered_df["营业总收入"] - filtered_df["营业成本"]

        # 毛利率 = 毛利润 / 营业总收入
        filtered_df["毛利率"] = (filtered_df["毛利润"] / filtered_df["营业总收入"]).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 费用率 = (销售费用 + 管理费用 + 研发费用) / 营业总收入
        filtered_df["费用率"] = (
            (filtered_df["销售费用"] + filtered_df["管理费用"] + filtered_df["研发费用"]) / 
            filtered_df["营业总收入"]
        ).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 营业利润率 = (毛利润 - 销售费用 - 管理费用 - 研发费用) / 营业总收入
        filtered_df["营业利润率"] = (
            (filtered_df["毛利润"] - filtered_df["销售费用"] - filtered_df["管理费用"] - filtered_df["研发费用"]) / 
            filtered_df["营业总收入"]
        ).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 费用占毛利润 = (销售费用 + 管理费用 + 研发费用) / 毛利润
        filtered_df["费用占毛利润"] = (
            (filtered_df["销售费用"] + filtered_df["管理费用"] + filtered_df["研发费用"]) / 
            filtered_df["毛利润"]
        ).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 净利率 = 净利润 / 营业总收入
        filtered_df["净利率"] = (
            filtered_df["净利润"] / filtered_df["营业总收入"]
        ).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 营业外收入占比 = 营业外收入 / 营业总收入
        filtered_df["营业外收入占比"] = (
            filtered_df["营业外收入"] / filtered_df["营业总收入"]
        ).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 构造结果
        results = []
        for _, row in filtered_df.iterrows():
            # 基础字段，确保"报告日期"在第一位
            base_fields = {
                "报告日期": row["报告日"].strftime("%Y-%m-%d") if not pd.isna(row["报告日"]) else ""
            }

            # 添加利润表的原始字段
            balance_fields = {field: row[field] for field in numeric_columns}

            # 计算字段
            indicators = {
                "毛利润": row["毛利润"],
                "毛利率": row["毛利率"],
                "费用率": row["费用率"],
                "营业利润率": row["营业利润率"],
                "费用占毛利润": row["费用占毛利润"],
                "净利率": row["净利率"],
                "营业外收入占比": row["营业外收入占比"],
            }

            # 合并字段，按照报告日期 -> 利润表字段 -> 计算字段
            ordered_result = {**base_fields, **balance_fields, **indicators}
            results.append(ordered_result)

        # 转换为 DataFrame 并按报告日期排序（降序）
        result_df = pd.DataFrame(results)
        result_df.sort_values(by="报告日期", ascending=False, inplace=True)

        return result_df.to_dict(orient='records')

    except Exception as e:
        print(f"处理数据时出错: {str(e)}")
        return []

# # 示例调用
# if __name__ == "__main__":
#     stock_code = "sh600600"
#     start_date = "2014-01-01"
#     end_date = pd.Timestamp.now().strftime("%Y-%m-%d")
#     income_sheet_data = process_income_statement(stock_code, start_date, end_date)

#     if income_sheet_data:
#         # 转到 CSV
#         output_file = "/home/seele_vollerei/公共/Code/Python/report_api/income_sheets_data.csv"
#         pd.DataFrame(income_sheet_data).to_csv(output_file, index=False)
#         print(f"数据已写入 {output_file}")
#     else:
#         print("没有数据写入 CSV。")
