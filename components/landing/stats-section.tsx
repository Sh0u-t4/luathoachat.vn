'use client';

import { FlaskConical, FileText, Scale, Headphones } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

export function StatsSection() {
  const { t } = useLanguage();

  const stats = [
    {
      icon: FlaskConical,
      value: '2,500+',
      label: t.stats.chemicals,
      description: t.stats.chemicalsDesc,
    },
    // {
    //   icon: FileText,
    //   value: '1,000+',
    //   label: t.stats.msds,
    //   description: t.stats.msdsDesc,
    // },
    {
      icon: Scale,
      value: '4',
      label: t.stats.decrees,
      description: t.stats.decreesDesc,
    },
    {
      icon: Headphones,
      value: '24/7',
      label: t.stats.support,
      description: t.stats.supportDesc,
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            {t.stats.title}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {t.stats.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center group">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-cyan-50 flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                <stat.icon className="w-7 h-7 text-cyan-600" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-slate-700 mb-1">{stat.label}</div>
              <div className="text-xs text-slate-500">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
