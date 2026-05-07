# 🚀 OpenCode 毕设项目: 极速全栈运行指南 (保姆级)

本项目是一个前后端分离的系统，分为：
1. **后端 (Backend)**：`report_api` 目录，由 Python (FastAPI + Pandas + akshare) 编写。
2. **前端 (Frontend)**：`financial-data-visualization` 目录，由 Next.js (React) 编写。
3. **数据库 (Database)**：使用 PostgreSQL，并通过前面讲的 Drizzle ORM 进行管理。

---

## 🛠️ 第一步：数据库准备 (Navicat 操作)

1. 打开电脑上的 **Navicat**。
2. 新建一个 PostgreSQL 连接（如果已有就直接双击连接），用户名一般是 `postgres`，密码是你自己设定的（如 `123456`），端口默认是 `5432`。
3. 右键点击你的连接 -> **新建数据库**。
4. 数据库名填入：`financial`。字符集保持默认 (UTF-8) 即可。
5. **无需手动执行建表 SQL！** 后面我们会通过前端代码的回调命令一键自动建表。

---

## 🐍 第二步：后端启动 (PyCharm 操作)

你提到想用 PyCharm 来运行后端，请严格按照以下步骤：

### 1. 用 PyCharm 打开项目
1. 启动 PyCharm。
2. 点击 **Open (打开)**，在你的电脑里找到并选择 `d:\桌面\financial\report_api` **这个具体的文件夹**。
   *(⚠️ 注意：一定要打开 `report_api` 这一层，不要打开最外层的 `financial`，否则 PyCharm 识别不到正确的 Python 根目录)*。

### 2. 配置 Python 解释器 (Interpreter)
1. 点击右下角的解释器版本号（或者去菜单 `File` -> `Settings` -> `Project: report_api` -> `Python Interpreter`）。
2. 点击 `Add Interpreter` -> `Add Local Interpreter`。
3. 选择 **System Interpreter**，找到你电脑上的 Python 3.12 (例如 `C:\Python312\python.exe` 或其他你安装的位置)。点击 OK。

### 3. 安装依赖包
在 PyCharm 最下方的 **Terminal (终端)** 栏，点开它，输入以下命令安装需要的库：
```bash
pip install fastapi uvicorn akshare pandas
```
*(如果网络慢，可以加上镜像源：`pip install fastapi uvicorn akshare pandas -i https://pypi.tuna.tsinghua.edu.cn/simple`)*

### 4. 运行服务
1. 在左侧项目目录树中，找到 `statement.py`。
2. **右键点击 `statement.py`**，选择 **`Run 'statement'`** (或者带绿色箭头的运行按钮)。
3. 在下方的 Run 控制台中，当你看到以下字样就代表**后端启动成功**了：
   `INFO: Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)`
   *(⚠️ 此时不要关闭 PyCharm，把它挂在后台运行即可)*。

---

## 💻 第三步：前端启动 (命令行操作)

前端我们不需要开大型 IDE，直接用 Windows 的命令提示符（终端）启动即可。

### 1. 配置环境变量文件
1. 确保在 `d:\桌面\financial\financial-data-visualization` 目录下，有一个叫 `.env` 的文件。
2. 用记事本打开它，确保里面的内容是：
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5432/financial
   REPORT_API_BASE_URL=http://127.0.0.1:8000
   ```
   *(如果你的数据库密码不是123456，请在这里改掉)*。

### 2. 自动建表 (重要！)
打开你的系统命令行（Win+R 输入 cmd，或者 PowerShell），执行以下命令：
```bash
cd d:\桌面\financial\financial-data-visualization

# 执行 Drizzle 推送命令，它会根据代码结构自动在你的 financial 数据库里把所有表建好！
bun run drizzle-kit push
```
*(如果你现在去 Navicat 里刷新一下 public 下的表，你会发现所有的表都已经神奇地建好了！)*

### 3. 启动前端页面
接着在同一个黑框终端里，运行启动命令：
```bash
bun dev -- -p 5000
```
*(说明：正常应该是 `bun dev` 跑在 3000 端口，但 Windows 系统的 3000 端口极易被系统保留或被其他软件占用报错 `EACCES`，所以我们强制它跑在 5000 端口。)*

等待几秒钟，如果看到绿色的 `Ready in x.x s`，说明前端也启动完毕！

---

## 🎯 第四步：验收结果 (浏览器中查看)

前后端都成功挂在后台后，打开你常用的浏览器（Chrome / Edge 等）：

因为前端首页（也就是 `http://localhost:5000/`）是 Next.js 的默认推广欢迎页，所以咱们直接访问业务页：

👉 **在浏览器地址栏完整的输入：**
### `http://localhost:5000/dashboard`

敲回车！你就可以看到你的毕设页面了！🎉🎉🎉

*(日常开发或演示时，只需确保 PyCharm 里的 Python 跑着，以及命令行里的 `bun dev` 跑着即可。)*
