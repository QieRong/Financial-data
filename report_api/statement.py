from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from typing import List, Any
import akshare as ak
from merge_statment import calculate_financial_ratios
import pandas as pd

app = FastAPI(
    title="Financial Statement API",
    description="API for retrieving financial statements data",
    version="1.0.0",
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fix_stock_code(code: str) -> str:
    """自动补全沪深市场前缀"""
    if code.startswith("sh") or code.startswith("sz"):
        return code
    if code.startswith(("6", "5", "9")):
        return "sh" + code
    else:
        return "sz" + code

@app.get("/")
async def root():
    return {"message": "Financial Statement API is running"}


@app.get("/api/report/balance/period/{stock_code}", response_model=List[Any])
async def get_financial_statement_report_period(stock_code: str):
    """获取资产负债表的报告期数据"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(
            stock_code, "balance", aggregation="report_period"
        )
        if data.empty:
            raise HTTPException(
                status_code=404, detail="No data found for the given stock code"
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/income/period/{stock_code}", response_model=List[Any])
async def get_income_statement_report_period(stock_code: str):
    """获取利润表的报告期数据"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(
            stock_code, "income", aggregation="report_period"
        )
        if data.empty:
            raise HTTPException(
                status_code=404, detail="No data found for the given stock code"
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/cashflow/period/{stock_code}", response_model=List[Any])
async def get_cash_flow_statement_report_period(stock_code: str):
    """获取现金流量表的报告期数据"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(
            stock_code, "cashflow", aggregation="report_period"
        )
        if data.empty:
            raise HTTPException(
                status_code=404, detail="No data found for the given stock code"
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/balance/quarterly/{stock_code}", response_model=List[Any])
async def get_financial_statement_quarterly(stock_code: str):
    """获取资产负债表的季度数据"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(
            stock_code, "balance", aggregation="quarterly"
        )
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail="No quarterly data found for the given stock code",
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/income/quarterly/{stock_code}", response_model=List[Any])
async def get_income_statement_quarterly(stock_code: str):
    """获取利润表的季度数据"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(stock_code, "income", aggregation="quarterly")
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail="No quarterly data found for the given stock code",
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/cashflow/quarterly/{stock_code}", response_model=List[Any])
async def get_cash_flow_statement_quarterly(stock_code: str):
    """获取现金流量表的季度数据"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(
            stock_code, "cashflow", aggregation="quarterly"
        )
        if data.empty:
            raise HTTPException(
                status_code=404,
                detail="No quarterly data found for the given stock code",
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stocks/{stock_code}", response_model=dict)
async def get_stock_name(stock_code: str):
    """根据股票代码获取股票名称（容错版）"""
    try:
        # 自动补全沪深前缀
        full_code = stock_code
        if not full_code.startswith(('sh', 'sz')):
            if full_code.startswith(('6', '5', '9')):
                full_code = 'sh' + full_code
            else:
                full_code = 'sz' + full_code

        stock_df = ak.stock_info_a_code_name()
        # akshare 返回的 code 字段是不带 sh/sz 的，只对比后 6 位数字
        stock = stock_df[stock_df["code"] == full_code[-6:]]
        if stock.empty:
            return {"code": full_code, "name": "未知股票"}
        return {"code": full_code, "name": stock.iloc[0]["name"]}
    except Exception:
        # 任何意外（网络、解析等）都返回默认值，不抛 500
        return {"code": stock_code, "name": "查询失败"}


@app.get("/api/report/balance/yearly/{stock_code}", response_model=List[Any])
async def get_financial_statement_yearly(stock_code: str):
    """获取资产负债表的年度数据（使用第四季度数据）"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(stock_code, "balance", aggregation="yearly")
        if data.empty:
            raise HTTPException(
                status_code=404, detail="No yearly data found for the given stock code"
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/income/yearly/{stock_code}", response_model=List[Any])
async def get_income_statement_yearly(stock_code: str):
    """获取利润表的年度数据（使用第四季度数据）"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(stock_code, "income", aggregation="yearly")
        if data.empty:
            raise HTTPException(
                status_code=404, detail="No yearly data found for the given stock code"
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/cashflow/yearly/{stock_code}", response_model=List[Any])
async def get_cash_flow_statement_yearly(stock_code: str):
    """获取现金流量表的年数据（使用第四季度数据）"""
    try:
        stock_code = fix_stock_code(stock_code)
        data = calculate_financial_ratios(stock_code, "cashflow", aggregation="yearly")
        if data.empty:
            raise HTTPException(
                status_code=404, detail="No yearly data found for the given stock code"
            )
        return data.to_dict(orient="records")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def run_server(host: str = "0.0.0.0", port: int = 8000):
    """运行服务器"""
    try:
        uvicorn.run(app, host=host, port=port)
    except Exception as e:
        print(f"启动服务器时出错: {str(e)}")


if __name__ == "__main__":
    run_server()
