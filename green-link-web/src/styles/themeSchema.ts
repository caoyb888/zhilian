/**
 * 绿产智链 —— 三种 UI 风格的中心化样式字典（Style Dictionary）
 * 基于 Tailwind CSS 原子类，按 ThemeKey 动态提取对应类名组合。
 *
 * 风格说明：
 * - tech：智慧极客绿（暗色科技风，适用于数据驾驶舱）
 * - nordic：清新北欧绿（高白空间，适用于全站通用默认底座）
 * - office：商务蔚蓝绿（政企金融感，适用于签约/信贷专区）
 */

export type ThemeKey = 'tech' | 'nordic' | 'office'

export interface ThemeClasses {
  wrapper: string
  card: string
  textMain: string
  textMuted: string
  accentText: string
  badge: string
  primaryBtn: string
  secondaryBtn: string
  divider: string
}

export const COMPONENT_THEMES: Record<ThemeKey, ThemeClasses> = {
  // 风格 A：智慧极客绿（Tech-Sleek Eco）
  tech: {
    wrapper: 'bg-brand-tech-bg text-slate-100 min-h-screen',
    card: 'bg-brand-tech-surface border border-brand-tech-border rounded-xl p-5 hover:border-brand-tech-neon/50 shadow-lg shadow-emerald-950/10 transition-all duration-300',
    textMain: 'text-slate-100 font-bold',
    textMuted: 'text-slate-400 text-xs',
    accentText: 'text-brand-tech-neon font-mono font-bold',
    badge:
      'bg-emerald-950/40 text-brand-tech-neon border border-emerald-800/60 font-mono text-[11px] px-2 py-0.5 rounded',
    primaryBtn:
      'bg-gradient-to-r from-brand-tech-neon to-brand-tech-cyan text-slate-950 font-black px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all shadow-md shadow-emerald-500/20',
    secondaryBtn:
      'border border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs',
    divider: 'border-brand-tech-border',
  },

  // 风格 B：清新北欧绿（Clean Nordic）
  nordic: {
    wrapper: 'bg-brand-nordic-bg text-stone-800 min-h-screen',
    card: 'bg-brand-nordic-surface border border-brand-nordic-border rounded-lg p-5 hover:shadow-xl hover:border-brand-nordic-forest/40 transition-all duration-200',
    textMain: 'text-stone-800 font-semibold',
    textMuted: 'text-brand-nordic-clay text-xs',
    accentText: 'text-brand-nordic-forest font-bold',
    badge:
      'bg-emerald-500/5 text-brand-nordic-forest border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold rounded',
    primaryBtn:
      'bg-brand-nordic-forest hover:bg-emerald-800 text-white font-medium px-4 py-2 rounded shadow-sm active:scale-[0.98] transition-all',
    secondaryBtn:
      'border border-brand-nordic-border bg-white hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded text-xs',
    divider: 'border-brand-nordic-border',
  },

  // 风格 C：商务蔚蓝绿（Vibrant Blue-Green）
  office: {
    wrapper: 'bg-brand-office-bg text-slate-800 min-h-screen',
    card: 'bg-brand-office-surface border border-brand-office-border rounded-xl p-5 hover:shadow-lg hover:border-cyan-500/50 transition-all duration-200',
    textMain: 'text-slate-800 font-bold',
    textMuted: 'text-slate-500 text-xs',
    accentText: 'text-brand-office-navy font-bold font-mono',
    badge:
      'bg-cyan-50 text-cyan-700 border border-cyan-200/50 text-[11px] px-2 py-0.5 rounded',
    primaryBtn:
      'bg-gradient-to-r from-brand-office-navy to-brand-office-mint hover:opacity-95 text-white font-medium px-4 py-2 rounded-lg active:scale-[0.98] transition-all shadow-sm',
    secondaryBtn:
      'border border-brand-office-border bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs',
    divider: 'border-brand-office-border',
  },
}
