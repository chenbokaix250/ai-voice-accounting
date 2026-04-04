# AI 语音记账

一个智能语音记账应用，支持语音输入和手动添加，AI 自动解析金额、类别和日期。

## 功能特性

- 🎤 **语音记账** - 按住按钮说话，AI 自动解析为记账记录
- ✍️ **手动记账** - 传统表单输入，支持 AI 智能分类
- 📊 **统计图表** - 收支统计、分类饼图、趋势分析
- 📈 **报表分析** - 月度/周度报表，支出预警
- 📝 **历史记录** - 筛选、搜索、导出 CSV
- 💾 **本地存储** - 数据存储在浏览器，无需后端

## 技术栈

- **前端框架**: Next.js 16 + React 19
- **样式方案**: Tailwind CSS 4
- **组件库**: shadcn/ui
- **图表库**: Recharts
- **AI 服务**: Google Gemini API
- **语音识别**: Web Speech API (浏览器内置)
- **数据存储**: localStorage

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

复制环境变量示例文件：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入你的 Gemini API Key：

```
GEMINI_API_KEY=你的API密钥
```

> 获取 API Key: https://aistudio.google.com/apikey

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始使用。

## 使用说明

### 语音记账

1. 点击麦克风按钮或按 `F1` 键开始录音
2. 说出记账内容，例如："午餐花了35块"
3. 松开按钮或再次点击结束录音
4. AI 自动解析并添加记录

### 手动记账

1. 切换到「手动添加」标签
2. 输入金额、选择类别、日期和备注
3. 点击魔法棒 ✨ 图标可让 AI 智能识别
4. 点击「添加记录」完成

### 支持的类别

**支出类别**: 餐饮、交通、购物、娱乐、医疗、教育、居住、其他支出

**收入类别**: 工资、奖金、投资、兼职、其他收入

## 项目结构

```
├── app/                    # Next.js 页面
│   ├── page.tsx           # 首页（记账入口）
│   ├── history/           # 历史记录页
│   ├── stats/             # 统计图表页
│   ├── reports/           # 报表页
│   └── api/               # API 路由
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── voice-recorder.tsx # 语音录音组件
│   ├── manual-add-form.tsx # 手动添加表单
│   └── record-card.tsx   # 记账卡片
├── hooks/                 # React Hooks
│   ├── use-records.ts    # 记账数据管理
│   └── use-voice.ts      # 语音识别
├── lib/                   # 工具函数
│   ├── storage.ts        # localStorage 操作
│   └── gemini.ts         # Gemini API 调用
├── types/                 # TypeScript 类型定义
│   └── record.ts         # 记账记录类型
└── public/               # 静态资源
```

## API 说明

### POST /api/parse-text

解析文本，提取记账信息。

**请求体**:
```json
{ "text": "午餐花了35块" }
```

**响应**:
```json
{
  "success": true,
  "data": {
    "amount": 35,
    "category": "餐饮",
    "type": "expense",
    "date": "2026-04-05",
    "note": "午餐",
    "confidence": 0.95
  }
}
```

## 部署

### Vercel 部署（推荐）

```bash
npm run build
vercel deploy
```

### Docker 部署

```bash
docker build -t ai-accounting .
docker run -p 3000:3000 ai-accounting
```

## 浏览器兼容性

语音识别功能需要浏览器支持 Web Speech API：

- ✅ Chrome 33+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Firefox (不支持)

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 代码检查
```

## 许可证

MIT License