# 艾刷 aishua · 艾宾浩斯抗遗忘智能刷题系统 ⚡

**艾刷 aishua** 是一款基于 **Vue 3 + Tailwind CSS + Pinia + 云端多端同步** 构建的高效备考题库系统，采用经典**艾宾浩斯遗忘曲线（Spaced Repetition Algorithm）**，全面覆盖国家电网 832 道核心题库（单选题 352 道、多选题 253 道、判断题 227 道）。

---

## 🌟 核心特性

- 🧠 **艾宾浩斯动态记忆排程**：
  - 题目按 `Stage 0 (生疏)` 至 `Stage 6 (彻底掌握)` 递进。
  - 答对延长复习间隔（1天、2天、4天、7天、15天、30天）；答错即刻重置为 Stage 0 并归入错题本。
- 📊 **可视化记忆看板**：
  - 艾宾浩斯 7 阶段记忆状态漏斗图。
  - 5 大专题掌握度进度条（形势政策、企业文化、公司战略、新型电力系统、品牌建设）。
  - 连续打卡天数记录。
- 🎯 **多维度刷题模式**：
  - **艾宾浩斯智能复习模式**（按到期优先算法动态出题）。
  - **新题突击模式**（按未学题量推进）。
  - **分类专题与题型专练**。
  - **错题攻坚本**。
  - **全真模拟考场**（随机抽取 100 题，60 分钟倒计时，交卷即时出分）。
- 🔒 **用户注册认证、自动同步与 IP 防火墙**：
  - **未注册用户**：数据保存在本地浏览器中，不占用云端资源；
  - **用户注册与登录**：支持输入授权码 **`ADBC`** 注册，注册/登录后自动进入云端同步模式；
  - **自动与手动同步**：支持每次做题后台实时自动同步，并提供右上角及设置页面一键手动全量同步；
  - **IP 黑名单**：输错授权码累计达到 5 次，系统即刻拉黑该公网 IP，禁止其再进行注册。
- ⌨️ **沉浸式交互**：
  - 键盘快捷键盲打（`A/B/C/D` 选选项，`Enter` 提交多选，`←/→` 切换题目）。
  - 答题卡抽屉实时跳转与查缺补漏。
  - 庆祝礼花与动态正反馈。

---

## 🚀 本地开发与预览

```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务
npm run dev

# 3. 生产环境构建打包
npm run build
```

---

## ☁️ Vercel 一键部署指南

本项目原生支持直接部署至 **Vercel**：

1. 打开 [Vercel 控制台](https://vercel.com)，点击 **Add New...** -> **Project** 导入 `uwwp/aishua` 仓库。
2. 在 **Configure Project** 页面中的 **Environment Variables**（环境变量）处添加以下两个变量：
   - `VITE_SUPABASE_URL`：`https://saigwpqwinueodihnvib.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`：`sb_publishable_Ml61D5xU_pgC2DIjRhzERw_G5HiKac6`
3. 点击 **Deploy**，大约 30 秒即可构建完成并获得全球 CDN 加速的线上访问链接！

---

## 🗄️ 数据库初始化配置脚本 (SQL)

进入您的云端数据库控制台 -> 选择项目 -> 点击左侧导航栏 **SQL Editor** -> 粘贴以下脚本并点击 **Run**：

```sql
-- 1. 创建用户题目学习进度表 (包含艾宾浩斯核心字段)
CREATE TABLE IF NOT EXISTS public.user_question_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_id INT NOT NULL,
    stage INT DEFAULT 0,
    review_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ DEFAULT now(),
    next_review_at TIMESTAMPTZ DEFAULT now(),
    is_favorite BOOLEAN DEFAULT false,
    in_wrong_book BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, question_id)
);

-- 2. 创建答题日志表 (用于统计每日打卡、正确率趋势)
CREATE TABLE IF NOT EXISTS public.quiz_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    question_id INT NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    mode TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 创建授权码防暴力破解与 IP 黑名单表
CREATE TABLE IF NOT EXISTS public.registration_ip_blacklist (
    ip TEXT PRIMARY KEY,
    failed_count INT DEFAULT 0,
    is_blocked BOOLEAN DEFAULT false,
    last_attempt_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 创建系统注册用户表 (支持免邮箱二次验证直连登录)
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 启用行级权限安全 (RLS)
ALTER TABLE public.user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_ip_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 6. 权限策略 (允许注册用户与客户端数据同步)
CREATE POLICY "Allow public read blacklist" 
ON public.registration_ip_blacklist FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update blacklist" 
ON public.registration_ip_blacklist FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow user manage progress" 
ON public.user_question_progress FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow user manage logs" 
ON public.quiz_logs FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow app users auth" 
ON public.app_users FOR ALL 
TO anon, authenticated 
USING (true)
WITH CHECK (true);
```
