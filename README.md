# Financial Data Visualization

一个面向 A 股财务分析学习场景的全栈数据可视化项目。项目通过后端接口获取并清洗上市公司财务报表数据，前端以图表、指标说明和趋势摘要的形式展示资产负债表、利润表、现金流量表及综合财务指标，帮助用户更直观地理解企业经营质量、偿债能力、盈利能力与资产使用效率。

> 本项目主要用于课程实践、财务分析学习和数据可视化展示，不构成任何投资建议。
<img width="2473" height="1334" alt="图片1" src="https://github.com/user-attachments/assets/e409a2a3-f20b-4627-9999-d0622b038cd7" />




## 项目亮点

- **三大财务报表分析**：覆盖资产负债表、利润表、现金流量表。
- **多周期数据切换**：支持报告期、季度、年度三种分析口径。
- **核心指标计算**：内置同比、环比、固定资产周转率、应收账款周转率、存货周转率、现金债务比、ROE、总资产收益率等指标。
- **股票代码查询**：支持输入 6 位股票代码，并自动补全沪深市场前缀。
- **可视化图表展示**：基于柱状图与折线图组合展示数值、同比和环比变化。
- **指标解释辅助理解**：在图表下方展示指标公式和业务含义，降低财务分析理解门槛。
- **前后端分离架构**：前端负责交互与可视化，后端负责数据获取、清洗和指标计算。

## 技术栈

### 前端

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- TanStack Query
- Drizzle ORM

### 后端

- Python
- FastAPI
- Uvicorn
- Pandas
- AkShare

### 数据库

- PostgreSQL
- Drizzle Kit

## 系统架构

```text
用户输入股票代码
        ↓
Next.js 前端页面
        ↓
/api 请求代理
        ↓
FastAPI 后端接口
        ↓
AkShare 获取财务数据
        ↓
Pandas 清洗、合并、指标计算
        ↓
返回 JSON 数据
        ↓
Recharts 图表展示与趋势摘要
```

## 功能模块

### 1. 资产负债表分析

主要分析企业资产结构、流动资产质量、非流动资产效率及偿债能力。

包含内容：

- 应收账款相关指标
- 预付账款分析
- 存货相关指标
- 固定资产相关指标
- 无形资产与开发支出分析
- 商誉分析
- 有息负债分析
- 偿债能力分析

### 2. 利润表分析

主要分析企业收入、成本、费用、利润和盈利能力。

包含内容：

- 营业收入分析
- 利润相关指标
- 毛利率、净利率、营业利润率
- 成本与费用分析
- 费用率分析
- 营业外收入分析
- ROE、总资产收益率、总资产周转率等综合盈利指标

### 3. 现金流量表分析

主要分析企业经营活动、投资活动、筹资活动现金流表现。

包含内容：

- 经营活动现金流
- 投资活动现金流
- 筹资活动现金流
- 主营业务收现比率
- 经营活动现金流净额与净利润比率

### 4. 综合分析

对不同报表中的关键指标进行组合观察，辅助判断企业整体财务表现。

## 核心指标示例

| 指标               | 计算逻辑                                  | 说明                                   |
| ------------------ | ----------------------------------------- | -------------------------------------- |
| 应收账款占营收比率 | 应收账款 ÷ 营业收入                       | 衡量收入中应收款占比，辅助观察回款压力 |
| 应收账款周转率     | 营业收入 ÷ 应收账款                       | 衡量应收账款回收效率                   |
| 存货周转率         | 营业成本 ÷ 平均存货                       | 衡量存货运营效率                       |
| 固定资产周转率     | 营业收入 ÷ 平均固定资产                   | 衡量固定资产利用效率                   |
| 现金债务比         | 现金及现金等价物余额 ÷ 有息负债           | 衡量短期现金偿债覆盖能力               |
| 主营业务收现比率   | 销售商品、提供劳务收到的现金 ÷ 营业总收入 | 衡量主营收入现金回收质量               |
| ROE                | 净利润率 × 资产周转率 × 权益乘数          | 衡量股东权益回报能力                   |
| 总资产收益率       | 净利润 ÷ 资产总计                         | 衡量企业资产整体盈利能力               |

## 项目目录结构

```text
Financial-data/
├── README_deploy.md
├── report_api/
│   ├── statement.py              # FastAPI 接口入口
│   ├── merge_statment.py         # 财务数据合并与指标计算
│   ├── balance_statement.py      # 资产负债表数据处理
│   ├── income_statement.py       # 利润表数据处理
│   └── cash_flow_statement.py    # 现金流量表数据处理
│
└── financial-data-visualization/
    ├── package.json
    ├── next.config.ts            # Next.js 配置与接口代理
    ├── drizzle.config.ts         # Drizzle 数据库配置
    └── src/
        ├── app/
        │   └── dashboard/        # 财务分析页面
        ├── components/
        │   └── ui/               # 通用 UI 与图表组件
        └── server/
            └── models/schema/    # 数据库表结构定义
```

## 本地运行

### 环境要求

请提前安装：

- Node.js / Bun
- Python 3.12 或相近版本
- PostgreSQL
- Navicat 或其他 PostgreSQL 管理工具

### 1. 克隆项目

```bash
git clone https://github.com/QieRong/Financial-data.git
cd Financial-data
```

### 2. 准备数据库

在 PostgreSQL 中创建数据库：

```text
financial
```

### 3. 启动后端服务

进入后端目录：

```bash
cd report_api
```

安装依赖：

```bash
pip install fastapi uvicorn akshare pandas
```

启动服务：

```bash
python statement.py
```

服务启动后默认运行在：

```text
http://127.0.0.1:8000
```

### 4. 配置前端环境变量

进入前端目录：

```bash
cd financial-data-visualization
```

新建 `.env` 文件：

```env
DATABASE_URL=postgresql://postgres:123456@localhost:5432/financial
REPORT_API_BASE_URL=http://127.0.0.1:8000
```

> 如果你的 PostgreSQL 用户名、密码或端口不同，请自行修改 `DATABASE_URL`。

### 5. 初始化数据库表

```bash
bun run drizzle-kit push
```

### 6. 启动前端项目

```bash
bun install
bun dev -- -p 5000
```

浏览器访问：

```text
http://localhost:5000/dashboard
```

## 使用说明

1. 打开 `http://localhost:5000/dashboard`。
2. 在页面右上角输入股票代码，例如：`600519`。
3. 在左侧导航中选择报表类型：资产负债表、利润表、现金流量表或综合分析。
4. 进入具体指标页面后，可切换报告期、季度或年度口径。
5. 通过图表查看指标数值、同比变化和环比变化。

## 后端接口

### 股票名称查询

```http
GET /api/stocks/{stock_code}
```

示例：

```http
GET /api/stocks/600519
```

### 财务报表数据查询

```http
GET /api/report/{report_type}/{period_type}/{stock_code}
```

参数说明：

| 参数        | 可选值                      | 说明      |
| ----------- | --------------------------- | --------- |
| report_type | balance / income / cashflow | 报表类型  |
| period_type | period / quarterly / yearly | 数据周期  |
| stock_code  | 6 位股票代码                | 如 600519 |

示例：

```http
GET /api/report/balance/period/600519
GET /api/report/income/quarterly/600519
GET /api/report/cashflow/yearly/600519
```

## 数据处理逻辑

后端会对资产负债表、利润表和现金流量表进行统一处理：

1. 根据股票代码获取原始财务数据。
2. 对不同报表按报告日期进行合并。
3. 对缺失字段进行兜底处理，避免因字段缺失导致计算中断。
4. 按分析场景计算财务指标。
5. 根据报告期、季度、年度三种口径生成结果。
6. 返回前端可直接渲染的 JSON 数据。

## 可视化设计

前端图表组件采用组合图形式：

- 柱状图展示指标数值。
- 折线图展示同比、环比变化。
- 数据摘要展示最新数值与趋势变化。
- 指标说明展示公式和业务含义。

## 注意事项

- 项目依赖 AkShare 获取数据，接口结果可能受网络环境和数据源稳定性影响。
- 当前项目主要用于学习和展示，未针对生产环境做完整的权限、安全和性能优化。
- 前端默认通过 Next.js rewrites 将 `/api` 请求代理到本地 FastAPI 服务。
- 数据库连接信息请不要提交真实生产密码。

## 后续优化方向

- 增加用户自定义指标收藏功能。
- 增加多股票横向对比能力。
- 增加财务指标异常提醒。
- 增加图表导出与报告导出功能。
- 增加接口缓存，减少重复请求。
- 完善登录、权限和数据持久化能力。
- 增加单元测试与接口测试覆盖率。

## License

本项目仅用于学习交流。如需用于其他用途，请结合实际数据源授权和业务合规要求进行评估。
