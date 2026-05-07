import pandas as pd
from balance_statement import process_balance_statement
from cash_flow_statement import process_cash_flow_statement
from income_statement import process_income_statement


def calculate_financial_ratios(
    stock_code: str,
    report_type: str,
    aggregation: str = "report_period",
    start_date: str = "2013-1-1",
    end_date: str = pd.Timestamp.now().strftime("%Y-%m-%d"),
) -> pd.DataFrame:
   
   
    """
     根据财务报表计算财务比率。
    参数：
    -stock_code (str)：股票代码。
    -report_type (str)：报告类型（“余额”、“现金流”、“收入”）。
    -聚合 (str)：数据聚合类型（'report_period'、'quarterly' 或 'yearly'）。
    -start_date (str)：数据检索的开始日期。
    -end_date (str)：数据检索的结束日期。

    返回：
    -pd.DataFrame：包含财务比率的DataFrame。
    """
    # 获取扩展时间范围的数据
    adjusted_start_date = pd.to_datetime(start_date) - pd.DateOffset(months=12)
    adjusted_start_date_str = adjusted_start_date.strftime("%Y-%m-%d")

    # 获取财务报表数据
    income_statement_data = pd.DataFrame(
        process_income_statement(stock_code, adjusted_start_date_str, end_date)
    )
    cash_flow_statement_data = pd.DataFrame(
        process_cash_flow_statement(stock_code, adjusted_start_date_str, end_date)
    )
    balance_statement_data = pd.DataFrame(
        process_balance_statement(stock_code, adjusted_start_date_str, end_date)
    )

    statement_frames = [
        income_statement_data,
        cash_flow_statement_data,
        balance_statement_data,
    ]
    if any(df.empty or "报告日期" not in df.columns for df in statement_frames):
        return pd.DataFrame()

    # 合并数据
    merged_data = income_statement_data.merge(
        cash_flow_statement_data, on="报告日期", how="outer"
    ).merge(balance_statement_data, on="报告日期", how="outer")

    # 填充缺失值并按报告日期排序
    merged_data.fillna(0, inplace=True)
    merged_data.sort_values(by="报告日期", ascending=False, inplace=True)
    merged_data.reset_index(drop=True, inplace=True)

    # 根据聚合类型处理数据
    if aggregation == "yearly":
        # 不在这里进行年度数据转换，而是保持原始数据
        # 年度数据的转换和过滤将在aggregate_yearly_data中完成
        pass
    elif aggregation == "quarterly":
        # 现有的季度数据处理逻辑保持不变
        pass

    # 确保相关列存在，避免 KeyError
    required_columns = [
        "营业收入",
        "应收账款",
        "存货",
        "营业成本",
        "固定资产及清理合计",
        "有息负债",
        "现金及现金等价物余额",
        "可迅速变现的金融资产",
        "销售商品、提供劳务收到的现金",
        "营业总收入",
        "经营活动产生的现金流量净额",
        "净利润",
        "资产总计",
        "所有者权益(或股东权益)合计",
        "利润总额",
        "所得税费用",
        "生产资产",
    ]

    for col in required_columns:
        if col not in merged_data.columns:
            merged_data[col] = 0.0

    # 将相关列转换为数值型，处理可能的非数值数据
    for col in required_columns:
        merged_data[col] = pd.to_numeric(
            merged_data[col].astype(str).str.replace(",", "", regex=True),
            errors="coerce",
        ).fillna(0.0)

    if report_type == "balance":

        # 计算跨表字段
        # 1. 应收账款占营收比率
        merged_data["应收账款占营收比率"] = (
            merged_data["应收账款"] / merged_data["营业收入"]
        )
        merged_data["应收账款占营收比率"] = (
            merged_data["应收账款占营收比率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 2. 应收账款周转率
        merged_data["应收账款周转率"] = (
            merged_data["营业收入"] / merged_data["应收账款"]
        )
        merged_data["应收账款周转率"] = (
            merged_data["应收账款周转率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 3. 存货周转率
        merged_data["期初存货"] = merged_data["存货"].shift(-1)
        merged_data["平均存货"] = (merged_data["期初存货"] + merged_data["存货"]) / 2
        merged_data["存货周转率"] = merged_data["营业成本"] / merged_data["平均存货"]
        merged_data["存货周转率"] = (
            merged_data["存货周转率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 4. 固定资产周转率
        merged_data["期初固定资产"] = merged_data["固定资产及清理合计"].shift(-1)
        merged_data["平均固定资产"] = (
            merged_data["期初固定资产"] + merged_data["固定资产及清理合计"]
        ) / 2
        merged_data["固定资产周转率"] = (
            merged_data["营业收入"] / merged_data["平均固定资产"]
        )
        merged_data["固定资产周转率"] = (
            merged_data["固定资产周转率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 5. 现金债务比
        merged_data["现金债务比"] = (
            merged_data["现金及现金等价物余额"] / merged_data["有息负债"]
        )
        merged_data["现金债务比"] = (
            merged_data["现金债务比"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 6. 扩展现金债务比
        merged_data["扩展现金债务比"] = (
            merged_data["可迅速变现的金融资产"] + merged_data["现金及现金等价物余额"]
        ) / merged_data["有息负债"]
        merged_data["扩展现金债务比"] = (
            merged_data["扩展现金债务比"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 数据过滤
        merged_data["报告日期"] = pd.to_datetime(merged_data["报告日期"]).dt.date
        start_date_extended = pd.to_datetime(start_date).date()
        valid_data_mask = merged_data["报告日期"] >= start_date_extended
        merged_data = merged_data.loc[valid_data_mask].copy()

        analysis_data = merged_data[
            [
                "报告日期",
                "应收账款",
                "资产总计",
                "预付款项",
                "存货",
                "固定资产及清理合计",
                "无形资产",
                "开发支出",
                "商誉",
                "所有者权益(或股东权益)合计",
                # 计算字段
                "应收账款占总资产比率",
                "商誉占总资产比率",
                "杠杆系数",
                "生产资产",
                "有息负债",
                "有息负债占总资产比率",
                # 跨表计算字段
                "应收账款占营收比率",
                "应收账款周转率",
                "存货周转率",
                "固定资产周转率",
                "现金债务比",
                "扩展现金债务比",
            ]
        ].copy()

    elif report_type == "cashflow":

        # 7. 主营业务收现比率
        merged_data["主营业务收现比率"] = (
            merged_data["销售商品、提供劳务收到的现金"] / merged_data["营业总收入"]
        )
        merged_data["主营业务收现比率"] = (
            merged_data["主营业务收现比率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 8. 经营活动现金流净额与净利润比率
        merged_data["经营活动现金流净额与净利润比率"] = (
            merged_data["经营活动产生的现金流量净额"] / merged_data["净利润"]
        )
        merged_data["经营活动现金流净额与净利润比率"] = (
            merged_data["经营活动现金流净额与净利润比率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 数据过滤
        merged_data["报告日期"] = pd.to_datetime(merged_data["报告日期"]).dt.date
        start_date_extended = pd.to_datetime(start_date).date()
        valid_data_mask = merged_data["报告日期"] >= start_date_extended
        merged_data = merged_data.loc[valid_data_mask].copy()

        analysis_data = merged_data[
            [
                "报告日期",
                "期末现金及现金等价物余额",
                "销售商品、提供劳务收到的现金",
                "经营活动产生的现金流量净额",
                "投资活动产生的现金流量净额",
                "筹资活动产生的现金流量净额",
                "期初现金及现金等价物余额",
                # 计算字段
                "现金及现金等价物余额",
                # 跨表计算字段
                "主营业务收现比率",
                "经营活动现金流净额与净利润比率",
            ]
        ].copy()

    elif report_type == "income":
        # 9. ROE = (净利润 / 营业收入) * (营业收入 / 总资产) * (总资产 / 所有者权益)
        merged_data["净利润率"] = merged_data["净利润"] / merged_data["营业收入"]
        merged_data["资产周转率"] = merged_data["营业收入"] / merged_data["资产总计"]
        merged_data["权益乘数"] = (
            merged_data["资产总计"] / merged_data["所有者权益(或股东权益)合计"]
        )

        merged_data["ROE"] = (
            merged_data["净利润率"]
            * merged_data["资产周转率"]
            * merged_data["权益乘数"]
        )
        merged_data["ROE"] = (
            merged_data["ROE"].replace([float("inf"), -float("inf")], 0).fillna(0.0)
        )

        # 10. ROE净利率
        merged_data["期初净资产"] = merged_data["所有者权益(或股东权益)合计"].shift(-1)
        merged_data["平均净资产"] = (
            merged_data["期初净资产"] + merged_data["所有者权益(或股东权益)合计"]
        ) / 2
        merged_data["ROE净利率"] = merged_data["净利润"] / merged_data["平均净资产"]
        merged_data["ROE净利率"] = (
            merged_data["ROE净利率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 11. 生产资产回报率
        merged_data["生产资产回报率"] = (
            merged_data["利润总额"] + merged_data["所得税费用"]
        ) / merged_data["生产资产"]
        merged_data["生产资产回报率"] = (
            merged_data["生产资产回报率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 12. 总资产周转率
        merged_data["总资产周转率"] = (
            merged_data["营业总收入"] / merged_data["资产总计"]
        )
        merged_data["总资产周转率"] = (
            merged_data["总资产周转率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 13. 杠杆系数
        merged_data["杠杆系数"] = (
            merged_data["资产总计"] / merged_data["所有者权益(或股东权益)合计"]
        )
        merged_data["杠杆系数"] = (
            merged_data["杠杆系数"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 14. 总资产收益率
        merged_data["总资产收益率"] = merged_data["净利润"] / merged_data["资产总计"]
        merged_data["总资产收益率"] = (
            merged_data["总资产收益率"]
            .replace([float("inf"), -float("inf")], 0)
            .fillna(0.0)
        )

        # 数据过滤
        merged_data["报告日期"] = pd.to_datetime(merged_data["报告日期"]).dt.date
        start_date_extended = pd.to_datetime(start_date).date()
        valid_data_mask = merged_data["报告日期"] >= start_date_extended
        merged_data = merged_data.loc[valid_data_mask].copy()

        analysis_data = merged_data[
            [
                "报告日期",
                "营业收入",
                "营业总收入",
                "营业总成本",
                "营业成本",
                "销售费用",
                "管理费用",
                "研发费用",
                "财务费用",
                "营业利润",
                "净利润",
                "营业外收入",
                "利润总额",
                "所得税费用",
                # 计算字段
                "毛利润",
                "毛利率",
                "费用率",
                "营业利润率",
                "费用占毛利润",
                "净利率",
                "营业外收入占比",
                # 跨表计算字段
                "ROE",
                "总资产收益率",
                "杠杆系数",
                "生产资产回报率",
                "总资产周转率",
                "ROE净利率",
            ]
        ].copy()

    else:
        raise ValueError(
            "Invalid report_type. Choose from 'balance', 'cashflow', or 'income'."
        )

    if aggregation == "report_period":
        # 比率计算管道
        analysis_data = add_growth_metrics(analysis_data, "report_period")
    elif aggregation == "quarterly":
        # 进行季度数据聚合
        analysis_data = aggregate_quarterly_data(analysis_data, report_type)
    elif aggregation == "yearly":
        # 进行年度数据聚合
        analysis_data = aggregate_yearly_data(analysis_data)
    else:
        raise ValueError(
            "Invalid aggregation type. Choose from 'report_period', 'quarterly', or 'yearly'."
        )

    return analysis_data


def add_growth_metrics(data: pd.DataFrame, aggregation_type: str) -> pd.DataFrame:
    """
    Calculate sequential period (环比) and year-over-year (同比) growth metrics.

    Parameters:
    - data (pd.DataFrame): DataFrame containing financial data.
    - aggregation_type (str): Type of aggregation ('report_period', 'quarterly', or 'yearly').

    Returns:
    - pd.DataFrame: DataFrame with added growth metrics.
    """
    # 创建数据副本以避免修改原始数据
    result = data.copy()

    for col in data.columns:
        if col == "报告日期" or col == "季度" or col == "年度":
            continue  # 跳过日期列

        if aggregation_type == "quarterly":
            # 环比 = (当前值 - 上期值) / 上期值
            result[f"{col}_环比"] = (data[col] - data[col].shift(-1)) / data[col].shift(
                -1
            )
            # 同比 = (当前值 - 去年同期值) / 去年同期值
            result[f"{col}_同比"] = (data[col] - data[col].shift(-4)) / data[col].shift(
                -4
            )

            # 替换无穷大值和缺失值
            result[f"{col}_环比"] = result[f"{col}_环比"].replace(
                [float("inf"), -float("inf")], 0
            )
            result[f"{col}_环比"] = result[f"{col}_环比"].fillna(0)
        else:  # report_period or yearly
            # 只计算同比
            result[f"{col}_同比"] = (data[col] - data[col].shift(-1)) / data[col].shift(
                -1
            )

        # 替换无穷大值和缺失值
        result[f"{col}_同比"] = result[f"{col}_同比"].replace(
            [float("inf"), -float("inf")], 0
        )
        result[f"{col}_同比"] = result[f"{col}_同比"].fillna(0)

    return result


def aggregate_yearly_data(data: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate data by year, using the last report period data of each year as the yearly data,
    format dates, and add year-over-year (同比) growth metrics.
    Only use data from years that have December (Q4) data.

    Parameters:
    - data (pd.DataFrame): DataFrame containing financial data.

    Returns:
    - pd.DataFrame: Yearly aggregated DataFrame with growth metrics.
    """
    # 确保 '报告日期' 是 datetime 类型
    data["报告日期"] = pd.to_datetime(data["报告日期"])

    # 添加年度和月份信息
    data["年度"] = data["报告日期"].dt.year
    data["月份"] = data["报告日期"].dt.month

    # 找出每年最后一个报告期的月份
    last_month_per_year = data.groupby("年度")["月份"].max().reset_index()

    # 只保留12月份数据的年份
    valid_years = last_month_per_year[last_month_per_year["月份"] == 12][
        "年度"
    ].tolist()

    if not valid_years:
        return pd.DataFrame()  # 返回空的DataFrame

    # 过滤出有效年份的数据
    valid_data = data[data["年度"].isin(valid_years)].copy()

    # 按年度分组，取每年12月的数据
    yearly_data = valid_data[valid_data["月份"] == 12].copy()

    # 将年度作为日期列
    yearly_data["报告日期"] = yearly_data["年度"].astype(str)

    # 删除辅助列
    yearly_data = yearly_data.drop(columns=["年度", "月份"])

    # 添加同比增长指标
    yearly_data = add_growth_metrics(yearly_data, "yearly")

    yearly_data = yearly_data.sort_values(by="报告日期", ascending=False).reset_index(
        drop=True
    )

    return yearly_data


def is_ratio_column(column_name: str) -> bool:
    """Return True for ratio/multiple columns that should not be differenced."""
    ratio_markers = ("率", "占")
    ratio_columns = {"ROE", "杠杆系数", "权益乘数", "现金债务比", "扩展现金债务比"}
    return column_name in ratio_columns or any(marker in column_name for marker in ratio_markers)


def aggregate_quarterly_data(data: pd.DataFrame, report_type: str) -> pd.DataFrame:
    """
    Aggregate data by quarter, calculate differences between quarters, format dates,
    and add both sequential (环比) and year-over-year (同比) growth metrics.

    Parameters:
    - data (pd.DataFrame): DataFrame containing financial data.

    Returns:
    - pd.DataFrame: Quarterly aggregated DataFrame with growth metrics.
    """
    # 确保 '报告日期' 是 datetime 类型
    data["报告日期"] = pd.to_datetime(data["报告日期"])

    # 按日期升序排序，以便正确计算季度数据
    data_sorted = data.sort_values(by="报告日期", ascending=True).reset_index(drop=True)
    data_sorted["报告日期"] = data_sorted["报告日期"].dt.to_period("Q").astype(str)

    if report_type == "balance":
        quarterly_data = (
            data_sorted.groupby("报告日期", as_index=False).last()
            .sort_values(by="报告日期", ascending=False)
            .reset_index(drop=True)
        )
        return add_quarterly_growth_metrics(quarterly_data)

    # 分离日期列和数值列
    date_column = data_sorted["报告日期"]
    numeric_data = data_sorted.drop(columns=["报告日期"])

    # 利润表和现金流量表通常是累计口径：金额类字段做本季差分，
    # 比率/倍数字段保留当期比率，避免对比率本身做差分后再计算增长率。
    ratio_columns = [col for col in numeric_data.columns if is_ratio_column(col)]
    amount_columns = [col for col in numeric_data.columns if col not in ratio_columns]
    diff_data = numeric_data.copy()
    if amount_columns:
        diff_data[amount_columns] = numeric_data[amount_columns].diff()
    diff_data = diff_data.iloc[1:].copy()

    # 将当前季度的日期添加回差分数据
    diff_data["报告日期"] = date_column.iloc[1:].values

    # 按报告日期降序排序，以保持与原始报告期一致的顺序
    diff_data = diff_data.sort_values(by="报告日期", ascending=False).reset_index(
        drop=True
    )

    # 添加环比和同比增长指标
    diff_data = add_quarterly_growth_metrics(diff_data)

    return diff_data


def add_quarterly_growth_metrics(data: pd.DataFrame) -> pd.DataFrame:
    """
    Calculate sequential period (环比) and year-over-year (同比) growth metrics for quarterly data.

    Parameters:
    - data (pd.DataFrame): Quarterly aggregated DataFrame.

    Returns:
    - pd.DataFrame: DataFrame with added growth metrics.
    """
    # 创建数据副本以避免修改原始数据
    result = data.copy()

    for col in data.columns:
        if col == "报告日期":
            continue  # 跳过日期列

        # 环比 = (当前值 - 上期值) / 上期值
        result[f"{col}_环比"] = (data[col] - data[col].shift(-1)) / data[col].shift(-1)
        # 同比 = (当前值 - 去年同期值) / 去年同期值
        result[f"{col}_同比"] = (data[col] - data[col].shift(-4)) / data[col].shift(-4)

        # 替换无穷大值和缺失值
        result[f"{col}_环比"] = result[f"{col}_环比"].replace(
            [float("inf"), -float("inf")], 0
        )
        result[f"{col}_同比"] = result[f"{col}_同比"].replace(
            [float("inf"), -float("inf")], 0
        )
        result[f"{col}_环比"] = result[f"{col}_环比"].fillna(0)
        result[f"{col}_同比"] = result[f"{col}_同比"].fillna(0)

    return result
