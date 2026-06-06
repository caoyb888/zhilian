import React, { useState, useEffect } from 'react';

// === 模拟数据定义 ===
const INITIAL_RESOURCES = [
  {
    id: 'res-1',
    title: '50,000 吨林业碳汇(CCER)协议减排量转让',
    type: 'carbon',
    category: '碳资产/绿证',
    company: '山东东岳碳素集团有限公司',
    tags: ['国家核证', '林业碳汇', '2026签发'],
    creditScore: 98,
    badges: ['绿色工厂', '信用AAA'],
    value: '50k tCO2e',
    matchScore: 96,
  },
  {
    id: 'res-2',
    title: '分布式屋顶光伏余电上网及绿证(GEC)打包供给',
    type: 'green-power',
    category: '碳资产/绿证',
    company: '青岛华能新能源开发有限责任公司',
    tags: ['国家绿证', '分布式光伏', '双碳认证'],
    creditScore: 95,
    badges: ['领跑者企业'],
    value: '1,200 个绿证/年',
    matchScore: 91,
  },
  {
    id: 'res-3',
    title: '密闭高炉煤气余热高效回收发电成套设备技术',
    type: 'tech',
    category: '减排技术',
    company: '济南重工节能装备研究院',
    tags: ['废热回收', '钢铁制造', '专利技术'],
    creditScore: 92,
    badges: ['高新技术企业'],
    value: '能效提升 15%',
    matchScore: 88,
  },
  {
    id: 'res-4',
    title: '基于工业废渣的高强度超细微粉建筑骨料替代方案',
    type: 'material',
    category: '固废循环',
    company: '淄博新材料科技股份有限公司',
    tags: ['大宗固废', '建材替代', '低碳建材'],
    creditScore: 89,
    badges: ['认证绿建'],
    value: '10万吨/年产能',
    matchScore: 85,
  }
];

const INITIAL_DEMANDS = [
  {
    id: 'dem-1',
    title: '重工业园区碳中和规划及 2 万吨碳减排缺口采购需求',
    type: 'carbon',
    category: '碳资产/绿证',
    company: '潍柴动力股份有限公司',
    tags: ['碳履约', '碳普惠', '限时急购'],
    budget: '预算 80-120 万元',
    deadline: '2026-08-30',
  },
  {
    id: 'dem-2',
    title: '大型化工装置低碳改造成套技术集成商寻访',
    type: 'tech',
    category: '减排技术',
    company: '万华化学集团股份有限公司',
    tags: ['化工减排', 'EPC总包', '国家重点'],
    budget: '面议 (千万级)',
    deadline: '2026-10-15',
  },
  {
    id: 'dem-3',
    title: '绿色金融：200兆瓦陆上风电项目一期绿色信贷融资申请',
    type: 'finance',
    category: '绿色金融',
    company: '滨州城投新能源投资有限公司',
    tags: ['绿色信贷', '项目融资', 'AAA担保'],
    budget: '融资金额 4.5 亿元',
    deadline: '2026-07-01',
  }
];

const EXPERTS = [
  { id: 'exp-1', name: '张建国', title: '教授/博导', org: '山东大学低碳能源研究中心', domain: '工业CCUS与微藻固碳' },
  { id: 'exp-2', name: '林海潮', title: '首席专家', org: '省冶金设计院双碳咨询部', domain: '钢铁流程碳资产战略' }
];

// === 样式体系配置 ===
const STYLES = {
  'tech-dark': {
    name: '智慧极客绿 (Tech-Sleek Eco)',
    desc: '深色背景辅以高饱和荧光绿与青蓝光感。前沿科技感极强，适合大数据大盘、管理驾驶舱、集团 executive 汇报。',
    bg: 'bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black',
    navBg: 'bg-slate-900/80 border-slate-800',
    card: 'bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-lg shadow-emerald-950/10',
    textMuted: 'text-slate-400',
    primaryBtn: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 font-bold',
    secondaryBtn: 'border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200',
    accentText: 'text-emerald-400',
    badge: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80',
    divider: 'border-slate-800',
    cardIcon: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50',
    activeTab: 'bg-emerald-500 text-slate-950 font-bold',
    inactiveTab: 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
  },
  'clean-nordic': {
    name: '清新北欧绿 (Clean Nordic)',
    desc: '极简轻量。柔和奶白背景、林木深绿与矿石灰，高对比无干扰。环保温暖，具备强烈的协会公信力与易读性，适合高频填报。',
    bg: 'bg-[#fafaf9] text-stone-800 selection:bg-emerald-100 selection:text-emerald-900',
    navBg: 'bg-white/90 border-stone-200/60',
    card: 'bg-white border border-stone-200/80 hover:border-emerald-600/60 hover:shadow-xl hover:shadow-emerald-900/5 transition-all',
    textMuted: 'text-stone-500',
    primaryBtn: 'bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm',
    secondaryBtn: 'border border-stone-200 bg-white hover:bg-stone-50 text-stone-700',
    accentText: 'text-emerald-700 font-semibold',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
    divider: 'border-stone-150',
    cardIcon: 'bg-stone-100 text-stone-600',
    activeTab: 'bg-emerald-700 text-white font-medium',
    inactiveTab: 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
  },
  'vibrant-office': {
    name: '商务蔚蓝绿 (Vibrant Blue-Green)',
    desc: '企业级明快微渐变。深宝蓝过渡至常青绿，展现高成熟度商务质感。契合绿色金融、产学研对接及政企联合会商。',
    bg: 'bg-slate-50 text-slate-800 selection:bg-cyan-200 selection:text-cyan-900',
    navBg: 'bg-white/90 border-slate-200 shadow-sm',
    card: 'bg-white border border-slate-200/80 hover:shadow-lg hover:border-cyan-500/50 transition-all rounded-xl',
    textMuted: 'text-slate-500',
    primaryBtn: 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white font-medium',
    secondaryBtn: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    accentText: 'text-cyan-600 font-bold',
    badge: 'bg-cyan-50 text-cyan-700 border border-cyan-200/50',
    divider: 'border-slate-200',
    cardIcon: 'bg-cyan-50 text-cyan-600',
    activeTab: 'bg-cyan-600 text-white font-medium',
    inactiveTab: 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
  }
};

export default function App() {
  const [themeId, setThemeId] = useState('tech-dark');
  const [viewport, setViewport] = useState('pc'); // pc, tablet, mobile
  const [activeMenu, setActiveMenu] = useState('matching'); // index, matching, credentials, apply
  const [dataMode, setDataMode] = useState('resources'); // resources, demands
  
  // 匹配引擎演练状态
  const [matchStep, setMatchStep] = useState('idle'); // idle, recalling, ranking, matched, signing, signed
  const [selectedRes, setSelectedRes] = useState(null);
  const [selectedDem, setSelectedDem] = useState(INITIAL_DEMANDS[0]);
  const [matchingAnimation, setMatchingAnimation] = useState('');
  const [matchedResults, setMatchedResults] = useState([]);
  const [contractNo, setContractNo] = useState('');

  const currentTheme = STYLES[themeId];

  // 运行匹配算法演练
  const runMatchEngine = () => {
    setMatchStep('recalling');
    setMatchingAnimation('正在执行第一阶段：Elasticsearch 倒排索引召回与行业标签多向过滤...');
    
    setTimeout(() => {
      setMatchStep('ranking');
      setMatchingAnimation('正在执行第二阶段：权重计算中... [计算系数: 匹配度(x1.2) + 历史信誉(x1.0) + 绿色特质认证(x1.5)]');
      
      setTimeout(() => {
        setMatchStep('matched');
        // 加权分级后排序
        const ranked = INITIAL_RESOURCES.map(res => {
          let scoreBoost = 0;
          if (res.badges.includes('绿色工厂')) scoreBoost += 5;
          if (res.badges.includes('信用AAA')) scoreBoost += 3;
          return { ...res, finalScore: Math.min(100, res.matchScore + scoreBoost) };
        }).sort((a, b) => b.finalScore - a.finalScore);
        
        setMatchedResults(ranked);
        setSelectedRes(ranked[0]); // 默认对接推荐第一名
      }, 1500);
    }, 1500);
  };

  // 模拟电子签约
  const startEsigning = () => {
    setMatchStep('signing');
    setTimeout(() => {
      setContractNo(`CN-20260603-${Math.floor(100000 + Math.random() * 900000)}`);
      setMatchStep('signed');
    }, 2000);
  };

  // 重置匹配沙盘
  const resetSandplay = () => {
    setMatchStep('idle');
    setMatchedResults([]);
    setSelectedRes(null);
    setContractNo('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* 顶部中央多功能控制器 */}
      <header className="bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & V1.0 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black tracking-wider text-sm shadow-md shadow-emerald-500/20">
              GL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-wide">绿产智链 UI 交互沙盘</h1>
                <span className="text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">V1.0</span>
              </div>
              <p className="text-xs text-slate-400">山东省绿色低碳产业生态智慧链接平台技术验证</p>
            </div>
          </div>

          {/* 切换风格风格 */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 px-2">风格：</span>
            {Object.entries(STYLES).map(([key, style]) => (
              <button
                key={key}
                onClick={() => setThemeId(key)}
                className={`text-xs px-3 py-1.5 rounded transition-all font-medium ${
                  themeId === key 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold shadow' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {style.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* 三端视口模拟控制器 */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 px-2">三端适配模拟：</span>
            <button 
              onClick={() => setViewport('pc')}
              className={`p-1.5 rounded ${viewport === 'pc' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="大屏显示器适配"
            >
              💻 电脑端 (lg)
            </button>
            <button 
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded ${viewport === 'tablet' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="iPad Pro 适配"
            >
              📟 平板端 (md)
            </button>
            <button 
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              title="智能手机适配"
            >
              📱 手机 H5 (sm)
            </button>
          </div>

        </div>
      </header>

      {/* 核心介绍及当前风格属性 */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800/80 text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-emerald-400">当前方案风格特性：</span> 
            <span className="text-slate-100">{currentTheme.name} ── </span>
            <span className="text-slate-400">{currentTheme.desc}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            一套 React + Tailwind 代码，自适应手机、平板与 PC。
          </div>
        </div>
      </div>

      {/* 设备视口模拟容器 */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/40">
        <div className={`transition-all duration-500 shadow-2xl relative border border-slate-800/60 rounded-2xl bg-black ${
          viewport === 'pc' ? 'w-full max-w-7xl h-full min-h-[780px]' :
          viewport === 'tablet' ? 'w-[768px] h-[1024px] rounded-3xl p-4' :
          'w-[375px] h-[780px] rounded-[42px] p-5 border-[12px] border-slate-800'
        }`}>
          
          {/* 手机端的听筒及小部件 */}
          {viewport === 'mobile' && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl z-50 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 mr-2"></span>
              <span className="w-8 h-1 bg-slate-900 rounded-full"></span>
            </div>
          )}

          {/* 模拟页面主体 */}
          <div className={`w-full h-full rounded-xl overflow-y-auto relative flex flex-col transition-colors duration-500 ${currentTheme.bg}`}>
            
            {/* 顶栏：绿产智链门户 & 供需大厅 */}
            <nav className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 py-3 flex items-center justify-between transition-colors duration-500 ${currentTheme.navBg}`}>
              <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold tracking-tight flex items-center gap-1 ${currentTheme.accentText}`}>
                  ♻️ 绿产智链 <span className="text-xs font-normal opacity-85">· Green-Link</span>
                </span>
              </div>
              <div className="hidden md:flex items-center gap-4 text-xs">
                <button 
                  onClick={() => setActiveMenu('matching')} 
                  className={`px-3 py-1 rounded transition-all ${activeMenu === 'matching' ? currentTheme.activeTab : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🧩 供需匹配沙盘
                </button>
                <button 
                  onClick={() => setActiveMenu('index')} 
                  className={`px-3 py-1 rounded transition-all ${activeMenu === 'index' ? currentTheme.activeTab : 'text-slate-400 hover:text-slate-200'}`}
                >
                  📊 ClickHouse 供需指数
                </button>
                <button 
                  onClick={() => setActiveMenu('credentials')} 
                  className={`px-3 py-1 rounded transition-all ${activeMenu === 'credentials' ? currentTheme.activeTab : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🏅 绿色认证管理
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono font-bold">山东高速集团(主)</span>
              </div>
            </nav>

            {/* 模拟器内容区 */}
            <main className="flex-1 p-4 md:p-6 pb-20">
              
              {/* 【模块一】双端自适应供需大厅：手机/平板/电脑自适应演示 */}
              <section className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      🌱 供需对接大厅
                      <span className="text-xs font-normal opacity-70">(Mobile First 响应式断点测验区)</span>
                    </h2>
                    <p className={`text-xs mt-1 ${currentTheme.textMuted}`}>一套代码自动编排：手机单列堆叠 ➔ 平板双列网格 ➔ 电脑三列看板</p>
                  </div>
                  
                  {/* 数据切换器 */}
                  <div className="flex bg-slate-800/40 p-1 rounded-lg border border-slate-700/50 text-xs w-fit">
                    <button 
                      onClick={() => setDataMode('resources')}
                      className={`px-3 py-1.5 rounded transition-all ${dataMode === 'resources' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-100'}`}
                    >
                      供给资源 (一期碳核证/绿证等)
                    </button>
                    <button 
                      onClick={() => setDataMode('demands')}
                      className={`px-3 py-1.5 rounded transition-all ${dataMode === 'demands' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-100'}`}
                    >
                      采购需求 (企业低碳减排缺口)
                    </button>
                  </div>
                </div>

                {/* 响应式网格断点示范：grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dataMode === 'resources' ? (
                    INITIAL_RESOURCES.map(res => (
                      <div key={res.id} className={`p-4 rounded-xl flex flex-col justify-between ${currentTheme.card}`}>
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${currentTheme.badge}`}>
                              {res.category}
                            </span>
                            <span className="text-xs font-mono font-semibold text-emerald-500">信用分: {res.creditScore}</span>
                          </div>
                          <h3 className="font-bold text-sm leading-snug hover:text-emerald-500 transition-colors duration-150 mb-2">
                            {res.title}
                          </h3>
                          <p className={`text-xs mb-3 ${currentTheme.textMuted}`}>{res.company}</p>
                          
                          {/* 绿色资质 */}
                          <div className="flex flex-wrap gap-1 mb-4">
                            {res.badges.map(b => (
                              <span key={b} className="text-[9px] bg-emerald-550/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
                                🌟 {b}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className={`pt-3 border-t flex items-center justify-between ${currentTheme.divider}`}>
                          <div>
                            <span className={`text-[10px] block ${currentTheme.textMuted}`}>供给规模</span>
                            <span className="text-xs font-bold font-mono">{res.value}</span>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedRes(res);
                              setActiveMenu('matching');
                              if(matchStep === 'idle' || matchStep === 'matched') {
                                setMatchStep('matched');
                              }
                            }}
                            className={`text-xs px-2.5 py-1.5 rounded transition-all ${currentTheme.secondaryBtn}`}
                          >
                            沙盘对接 ➔
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    INITIAL_DEMANDS.map(dem => (
                      <div key={dem.id} className={`p-4 rounded-xl flex flex-col justify-between ${currentTheme.card}`}>
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${currentTheme.badge}`}>
                              {dem.category}
                            </span>
                            <span className="text-xs text-rose-500 font-semibold">截至: {dem.deadline}</span>
                          </div>
                          <h3 className="font-bold text-sm leading-snug mb-2">{dem.title}</h3>
                          <p className={`text-xs mb-3 ${currentTheme.textMuted}`}>{dem.company}</p>
                          <div className="flex flex-wrap gap-1 mb-4">
                            {dem.tags.map(t => (
                              <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/50">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className={`pt-3 border-t flex items-center justify-between ${currentTheme.divider}`}>
                          <div>
                            <span className={`text-[10px] block ${currentTheme.textMuted}`}>意向预算</span>
                            <span className="text-xs font-bold text-emerald-500">{dem.budget}</span>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedDem(dem);
                              setActiveMenu('matching');
                              runMatchEngine();
                            }}
                            className={`text-xs px-3 py-1.5 rounded ${currentTheme.primaryBtn}`}
                          >
                            匹配竞合
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* 三端底部导航在手机端常驻演示 */}
              <div className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 py-2 px-6 flex justify-around items-center z-50 text-[10px] text-slate-400">
                <button onClick={() => { setActiveMenu('matching'); setViewport('mobile'); }} className={`flex flex-col items-center gap-1 ${activeMenu === 'matching' ? 'text-emerald-400' : ''}`}>
                  <span>🧩</span>
                  <span>匹配沙盘</span>
                </button>
                <button onClick={() => { setActiveMenu('index'); setViewport('mobile'); }} className={`flex flex-col items-center gap-1 ${activeMenu === 'index' ? 'text-emerald-400' : ''}`}>
                  <span>📊</span>
                  <span>供需指数</span>
                </button>
                <button onClick={() => { setActiveMenu('credentials'); setViewport('mobile'); }} className={`flex flex-col items-center gap-1 ${activeMenu === 'credentials' ? 'text-emerald-400' : ''}`}>
                  <span>🏅</span>
                  <span>绿色认证</span>
                </button>
              </div>

              {/* 【模块二】智能匹配引擎动态演示区（Recall & Ranking） */}
              {activeMenu === 'matching' && (
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                  
                  {/* 左侧：引擎控制台 */}
                  <div className={`lg:col-span-5 p-5 rounded-xl flex flex-col justify-between ${currentTheme.card}`}>
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm tracking-wide">⚙️ 撮合智能匹配引擎 (沙盘测试)</h3>
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-mono">二期核心能力</span>
                      </div>
                      
                      <div className="space-y-4 text-xs">
                        {/* 靶点选择 */}
                        <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                          <span className={`text-[10px] block mb-1 ${currentTheme.textMuted}`}>目标供求方需求(从大厅带入)：</span>
                          <span className="font-bold">{selectedDem.company}</span>
                          <p className="text-[11px] text-emerald-500 mt-1">{selectedDem.title}</p>
                        </div>

                        {/* 算法参数说明 */}
                        <div className="bg-slate-800/20 p-3 rounded-lg border border-slate-800/60">
                          <span className="font-semibold block mb-1.5 text-slate-300">引擎核心加权规则</span>
                          <ul className={`list-disc list-inside space-y-1 text-[11px] ${currentTheme.textMuted}`}>
                            <li>第一阶段：全量数据 IK 检索快速召回候选集</li>
                            <li>第二阶段：叠加 <span className="text-emerald-500 font-semibold">绿色低碳资质</span> 信用加分(权重+15%)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                      {matchStep === 'idle' && (
                        <button 
                          onClick={runMatchEngine}
                          className="w-full py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all duration-200 active:scale-95 text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 shadow-lg shadow-emerald-400/10"
                        >
                          ⚡ 启动双阶段匹配引擎
                        </button>
                      )}

                      {matchStep === 'recalling' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-blue-400">
                            <span>🚀 正在从 ClickHouse/ES 提取召回候选...</span>
                            <span className="animate-pulse">◌</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-1/2 animate-infinite-scroll"></div>
                          </div>
                          <p className="text-[10px] text-slate-500 italic">{matchingAnimation}</p>
                        </div>
                      )}

                      {matchStep === 'ranking' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-amber-400">
                            <span>⚙️ 排序打分阶段 (重度加权核算中)</span>
                            <span className="animate-spin">⚡</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full w-4/5 animate-pulse"></div>
                          </div>
                          <p className="text-[10px] text-slate-500 italic">{matchingAnimation}</p>
                        </div>
                      )}

                      {(matchStep === 'matched' || matchStep === 'signing' || matchStep === 'signed') && (
                        <div className="space-y-3">
                          <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg flex items-center justify-between text-xs text-emerald-400">
                            <span>✨ 已智能召回最契合的绿色项目！</span>
                            <button onClick={resetSandplay} className="text-[10px] text-slate-400 hover:text-slate-200 underline">重置沙盘</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：匹配推荐结果展示 */}
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    {matchedResults.length === 0 ? (
                      <div className={`flex-1 min-h-[250px] p-6 rounded-xl flex flex-col items-center justify-center text-center ${currentTheme.card}`}>
                        <span className="text-4xl mb-3 animate-bounce">🤖</span>
                        <h4 className="font-bold text-sm text-slate-200">引擎正等待运行</h4>
                        <p className={`text-xs max-w-sm mt-1.5 ${currentTheme.textMuted}`}>点击左侧的 “启动双阶段匹配引擎”，体验针对绿色低碳特色、信用和碳指标的多向智能排序效果。</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="font-bold text-xs tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                          🎯 召回推荐候选 (综合匹配排序最高)
                        </h3>

                        {matchedResults.map((res, idx) => (
                          <div 
                            key={res.id} 
                            onClick={() => setSelectedRes(res)}
                            className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                              selectedRes?.id === res.id 
                                ? 'bg-emerald-950/20 border-emerald-500 shadow-md shadow-emerald-500/5' 
                                : currentTheme.card
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
                                排名 {idx + 1} ➔
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] text-slate-400">综合匹配分:</span>
                                <span className="text-xs font-bold font-mono text-emerald-400">{res.finalScore} 分</span>
                              </div>
                            </div>
                            <h4 className="font-bold text-xs text-slate-200">{res.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">{res.company}</p>

                            {selectedRes?.id === res.id && (
                              <div className={`mt-3 pt-3 border-t border-dashed flex flex-col md:flex-row md:items-center justify-between gap-3 ${currentTheme.divider}`}>
                                <div className="text-[11px] text-slate-400">
                                  <span>签署保障意向书 (一期信用沉淀体系)</span>
                                </div>
                                {matchStep === 'matched' && (
                                  <button 
                                    onClick={startEsigning}
                                    className="text-xs font-bold px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-slate-950 active:scale-95 transition-all shadow-md"
                                  >
                                    ✍️ 发起线上电子签署 (法大大/契约锁)
                                  </button>
                                )}
                                {matchStep === 'signing' && (
                                  <div className="text-xs text-yellow-500 flex items-center gap-1.5">
                                    <span className="animate-spin">🔄</span>
                                    正在对接电子印章及国家授时存证区块链...
                                  </div>
                                )}
                                {matchStep === 'signed' && (
                                  <div className="bg-emerald-500 text-slate-950 text-xs px-3 py-1 rounded font-bold flex items-center gap-1">
                                    ✓ 存证盖章成功 (证书流水号: {contractNo})
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </section>
              )}

              {/* 【模块三】ClickHouse 工业碳资产与供需大屏指数 */}
              {activeMenu === 'index' && (
                <section className="space-y-6">
                  <div className={`p-5 rounded-xl ${currentTheme.card}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-sm">📈 2026 山东绿色低碳产业实时景气度供需指数</h3>
                        <p className={`text-xs mt-1 ${currentTheme.textMuted}`}>ClickHouse 增量聚合引擎，汇算全省 17 市钢铁、化工、电力的绿色技术缺口比率</p>
                      </div>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-mono">
                        每10分钟刷新 (Live)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 碳汇指标指数 */}
                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-[11px] text-slate-400 block">省内绿电/碳资产交易景气值</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-mono font-bold text-emerald-400">124.5</span>
                          <span className="text-xs text-emerald-500 font-bold">↑ +14.2%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">近30日省内林业/农林碳汇履约需求显著放量</p>
                      </div>

                      {/* 减排工艺热度 */}
                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-[11px] text-slate-400 block">高炉、窑炉余热发电技术供求比</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-mono font-bold text-amber-500">0.72</span>
                          <span className="text-xs text-rose-500 font-bold">↓ 供不应求</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">协会专家推荐：建议重点引入工业节能余热利用研发商</p>
                      </div>

                      {/* 绿色金融授信度 */}
                      <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <span className="text-[11px] text-slate-400 block">绿色信贷与ESG基金产品成功对接金额</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-mono font-bold text-sky-400">3.82 亿</span>
                          <span className="text-xs text-sky-400 font-bold">✓ 履约率 100%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-2">合作案例：滨州城投分布式光伏一期信贷全量办结</p>
                      </div>
                    </div>

                    {/* 政企协同脱敏汇报接口 */}
                    <div className="mt-5 p-3.5 bg-slate-900/60 rounded-lg border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-slate-200">🏢 报送上级主管机关 (工信厅 / 发改委)</span>
                        <p className="text-[11px] text-slate-400 mt-1">
                          平台每周向发改委“全省高耗能行业降碳专班”推送脱敏数据看板，为双碳政策决策提供实证支撑。
                        </p>
                      </div>
                      <button className={`px-3 py-1.5 rounded transition-all shrink-0 ${currentTheme.secondaryBtn}`}>
                        ⚡ 导出政企对接脱敏报告(.json)
                      </button>
                    </div>

                  </div>
                </section>
              )}

              {/* 【模块四】低碳资质与绿色认证标识专区 */}
              {activeMenu === 'credentials' && (
                <section className="space-y-4">
                  <div className={`p-5 rounded-xl ${currentTheme.card}`}>
                    <h3 className="font-bold text-sm mb-2">🏅 全省绿色低碳会员权威资质认证</h3>
                    <p className={`text-xs mb-4 ${currentTheme.textMuted}`}>
                      在匹配算法中，国家级绿色工厂、碳中和证书等标识将被赋予额外 15% - 25% 的高推荐权重，助力优质企业更早达成交易。
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-emerald-950/10 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-emerald-400 block">🌿 国家级“绿色工厂”资质标识</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">授信机构：国家工业和信息化部</span>
                        </div>
                        <span className="bg-emerald-500 text-slate-950 font-extrabold px-2 py-1 rounded text-[10px]">
                          权数: +25%
                        </span>
                      </div>

                      <div className="p-3 bg-cyan-950/10 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="font-bold text-cyan-400 block">💎 权威低碳/碳中和体系认证证书</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">授信机构：中国船级社(CCS)/中环联合认证</span>
                        </div>
                        <span className="bg-cyan-500 text-slate-950 font-extrabold px-2 py-1 rounded text-[10px]">
                          权数: +15%
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

            </main>

            {/* 一套代码下的移动端/平板端自适应页脚 */}
            <footer className={`mt-auto py-4 px-6 border-t text-center text-xs transition-colors duration-500 ${currentTheme.navBg} ${currentTheme.textMuted}`}>
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                <p>© 2026 山东绿色低碳产业生态智慧链接平台. All rights reserved.</p>
                <div className="flex gap-4">
                  <span>智库撮合</span>
                  <span>绿色金融</span>
                  <span>微信触达</span>
                </div>
              </div>
            </footer>

          </div>
        </div>
      </div>

      {/* 控制台辅助说明面板 (固定于页面底部，仅用于向PM说明UI) */}
      <section className="bg-slate-950 border-t border-slate-800 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400">
          <div>
            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              响应式断点测验方式
            </h4>
            <p>
              请在顶部点击 💻 电脑端、📟 平板端、📱 手机端，可以直接查看 Tailwind 框架对宽度的完美适配与流式折叠效果。在手机端，PC 的侧边栏和多列大表会平滑进化为底部抽屉/一列多卡片形式。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              如何进行 UI 评估决策？
            </h4>
            <p>
              切换“风格”选择器。您可以关注不同风格的色彩心理学效应：智慧极客绿偏向高精尖数字化政务汇报；北欧绿适合高频业务端申报，视觉压力低；商务蔚蓝绿则兼顾了传统国有企业和金融投资的审美惯性。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              匹配引擎沙盘跑动步骤
            </h4>
            <p>
              在一期“供需对接大厅”中，点击任一需求的“匹配竞合”按钮，系统会自动跳入匹配引擎面板，并实时展现“双阶段召回与打分”模拟。跑完匹配后，支持测试一键进行虚拟电子公章签署。
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}