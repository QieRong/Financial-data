import json
import akshare as ak
import pandas as pd
from typing import List, Dict, Any

def process_cash_flow_statement(stock_code: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    处理现金流量表数据，并计算指定字段和指标，支持筛选指定日期范围

    Args:
        stock_code: 股票代码
        start_date: 起始日期 (格式: YYYY-MM-DD)
        end_date: 结束日期 (格式: YYYY-MM-DD)

    Returns:
        包含现金流量表数据的列表，每个元素是一个字典
    """
    try:
        # 获取现金流量表数据
        df = ak.stock_financial_report_sina(stock=stock_code, symbol="现金流量表")

        if df is None or df.empty:
            print("未获取到现金流量表数据。")
            return []

        # 转换报告日期为标准日期类型
        df["报告日"] = pd.to_datetime(df["报告日"], format="%Y%m%d", errors="coerce")

        # 筛选指定日期范围的数据
        mask = (df["报告日"] >= start_date) & (df["报告日"] <= end_date)
        filtered_df = df.loc[mask].copy()

        if filtered_df.empty:
            print("筛选后的数据为空。")
            return []

        # 按报告日期升序排序，以便后续操作
        filtered_df.sort_values(by="报告日", inplace=True)

        # 清洗并转换数值型字段
        numeric_columns = [
            "期末现金及现金等价物余额", "销售商品、提供劳务收到的现金", 
            "经营活动产生的现金流量净额", "投资活动产生的现金流量净额", 
            "筹资活动产生的现金流量净额", "期初现金及现金等价物余额",
        ]

        for column in numeric_columns:
            filtered_df[column] = pd.to_numeric(
                filtered_df[column].astype(str).str.replace(',', '', regex=True), 
                errors='coerce'
            ).fillna(0.0)

        # **在遍历之前计算 '现金及现金等价物余额' 列**
        filtered_df["现金及现金等价物余额"] = (
            (filtered_df["期末现金及现金等价物余额"] + filtered_df["期初现金及现金等价物余额"]) / 2
        ).replace([pd.NA, float('inf'), -float('inf')], 0.0).fillna(0.0)

        # 构造结果
        results = []
        for _, row in filtered_df.iterrows():
            # 基础字段，确保"报告日期"在第一位
            base_fields = {
                "报告日期": row["报告日"].strftime("%Y-%m-%d") if not pd.isna(row["报告日"]) else ""
            }

            # 添加现金流量表的原始字段
            cash_flow_fields = {
                "期末现金及现金等价物余额": row["期末现金及现金等价物余额"],
                "销售商品、提供劳务收到的现金": row["销售商品、提供劳务收到的现金"],
                "经营活动产生的现金流量净额": row["经营活动产生的现金流量净额"],
                "投资活动产生的现金流量净额": row["投资活动产生的现金流量净额"],
                "筹资活动产生的现金流量净额": row["筹资活动产生的现金流量净额"],
                "期初现金及现金等价物余额": row["期初现金及现金等价物余额"],
            }

            # 计算字段
            indicators = {
                "现金及现金等价物余额": row["现金及现金等价物余额"]
            }

            # 合并字段，按照报告日期 -> 现金流量表字段 -> 计算字段
            ordered_result = {**base_fields, **cash_flow_fields, **indicators}
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
#     start_date = "2023-01-01"
#     end_date = "2023-12-31"
#     cash_flow_data = process_cash_flow_statement(stock_code, start_date, end_date)

#     if cash_flow_data:
#         # 将数据写入 CSV 文件
#         output_file = "/home/seele_vollerei/公共/Code/Python/report_api/cash_flow_data.csv"
#         pd.DataFrame(cash_flow_data).to_csv(output_file, index=False)
#         print(f"数据已写入 {output_file}")
#     else:
#         print("没有数据写入 CSV。")
