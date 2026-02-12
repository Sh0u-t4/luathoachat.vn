'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Download,
  AlertTriangle,
  Lock,
  ChevronLeft,
  Filter,
  FlaskConical,
} from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LeadCaptureModal } from '@/components/lead/lead-capture-modal';
import { supabase } from '@/lib/supabase';
import type { Chemical2026 } from '@/types';
import { ChatProvider } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';

interface ChemicalDisplay {
  id: string;
  name_vi: string;
  name_en: string;
  cas_number: string | null;
  un_number: string | null;
  hazard_pictograms: string[];
  license_required: boolean;
  decree_24_appendix: string;
  threshold_mass_kg: number | null;
  import_declaration_required: boolean;
  special_control: boolean;
  legal_reference: string | null;
}

const GHS_COLORS: Record<string, string> = {
  GHS01: 'bg-orange-100 text-orange-700 border-orange-200',
  GHS02: 'bg-red-100 text-red-700 border-red-200',
  GHS03: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  GHS04: 'bg-green-100 text-green-700 border-green-200',
  GHS05: 'bg-orange-100 text-orange-700 border-orange-200',
  GHS06: 'bg-red-100 text-red-700 border-red-200',
  GHS07: 'bg-amber-100 text-amber-700 border-amber-200',
  GHS08: 'bg-rose-100 text-rose-700 border-rose-200',
  GHS09: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export default function MSDSPage() {
  const { t, language } = useLanguage();
  const [chemicals, setChemicals] = useState<ChemicalDisplay[]>([]);
  const [filteredChemicals, setFilteredChemicals] = useState<ChemicalDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [licenseFilter, setLicenseFilter] = useState<string>('all');
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedChemical, setSelectedChemical] = useState<ChemicalDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const GHS_NAMES = t.msds.ghs;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsUnlocked(localStorage.getItem('content_unlocked') === 'true');
    }
  }, []);

  useEffect(() => {
    async function fetchChemicals() {
      try {
        const { data, error } = await supabase
          .from('chemicals_2026')
          .select('*')
          .order('vietnamese_name', { ascending: true });

        if (error) throw error;
        const mapped: ChemicalDisplay[] = (data || []).map((d: Chemical2026) => ({
          id: d.id,
          name_vi: d.vietnamese_name,
          name_en: d.english_name,
          cas_number: d.cas_number,
          un_number: d.un_number,
          hazard_pictograms: d.hazard_class ? [d.hazard_class] : [],
          license_required: d.license_type !== null,
          decree_24_appendix: d.decree_24_appendix,
          threshold_mass_kg: d.threshold_mass_kg,
          import_declaration_required: d.import_declaration_required,
          special_control: d.special_control,
          legal_reference: d.legal_reference,
        }));
        setChemicals(mapped);
        setFilteredChemicals(mapped);
      } catch (err) {
        console.error('Failed to fetch chemicals:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchChemicals();
  }, []);

  useEffect(() => {
    let filtered = chemicals;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name_vi.toLowerCase().includes(query) ||
          c.name_en.toLowerCase().includes(query) ||
          c.cas_number?.toLowerCase().includes(query)
      );
    }

    if (licenseFilter !== 'all') {
      filtered = filtered.filter((c) =>
        licenseFilter === 'required' ? c.license_required : !c.license_required
      );
    }

    setFilteredChemicals(filtered);
  }, [searchQuery, licenseFilter, chemicals]);

  const handleDownload = (chemical: ChemicalDisplay) => {
    if (!isUnlocked) {
      setSelectedChemical(chemical);
      setShowLeadModal(true);
    } else {
      alert(`Đang tải MSDS cho ${chemical.name_vi}...`);
    }
  };

  return (
    <ChatProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="pt-24 pb-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-600 mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.common.backToHome}
              </Link>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">{t.msds.pageTitle}</h1>
                  <p className="text-slate-600">
                    {t.msds.pageSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20">
                  {t.hero.badge1}
                </Badge>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  {t.hero.badge2}
                </Badge>
              </div>
            </div>

            <Card className="mb-6 border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder={t.msds.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={t.msds.filterLabel} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.msds.filterAll}</SelectItem>
                        <SelectItem value="required">{t.msds.filterRequired}</SelectItem>
                        <SelectItem value="not_required">{t.msds.filterNotRequired}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-sm text-slate-500 mb-4">
              {t.msds.foundResults.replace('{count}', filteredChemicals.length.toString())}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="border-0 shadow-md animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-6 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-100 rounded w-1/2 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-slate-100 rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredChemicals.map((chemical) => (
                  <Card
                    key={chemical.id}
                    className="border-0 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-900">
                            {language === 'vi' ? chemical.name_vi : chemical.name_en}
                          </CardTitle>
                          <p className="text-sm text-slate-500">
                            {language === 'vi' ? chemical.name_en : chemical.name_vi}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {chemical.decree_24_appendix && (
                            <Badge className="bg-slate-100 text-slate-700 text-xs">
                              {t.msds.appendix} {chemical.decree_24_appendix}
                            </Badge>
                          )}
                          {chemical.license_required && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {t.msds.requiresLicense}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {chemical.cas_number && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{t.msds.cas}:</span>
                            <span className="font-mono text-slate-700">
                              {chemical.cas_number}
                            </span>
                          </div>
                        )}
                        {chemical.un_number && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">UN:</span>
                            <span className="font-mono text-slate-700">
                              {chemical.un_number}
                            </span>
                          </div>
                        )}

                        {chemical.threshold_mass_kg && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">{t.msds.threshold}:</span>
                            <span className="font-semibold text-slate-700">
                              {chemical.threshold_mass_kg} kg
                            </span>
                          </div>
                        )}

                        {chemical.import_declaration_required && (
                          <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                            {t.msds.importDeclarationRequired}
                          </Badge>
                        )}

                        {chemical.special_control && (
                          <Badge variant="outline" className="text-xs border-red-300 text-red-700 bg-red-50">
                            {t.msds.specialControl}
                          </Badge>
                        )}

                        {chemical.hazard_pictograms && chemical.hazard_pictograms.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {chemical.hazard_pictograms.map((ghs) => (
                              <Badge
                                key={ghs}
                                variant="outline"
                                className={`text-xs ${GHS_COLORS[ghs] || ''}`}
                              >
                                {GHS_NAMES[ghs as keyof typeof GHS_NAMES] || ghs}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={() => handleDownload(chemical)}
                          className="w-full mt-4 bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          {isUnlocked ? (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              {t.msds.downloadMSDS}
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              {t.msds.unlockAndDownload}
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && filteredChemicals.length === 0 && (
              <div className="text-center py-12">
                <FlaskConical className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  {t.msds.noResults}
                </h3>
                <p className="text-slate-500">
                  {t.msds.noResultsSubtitle}
                </p>
              </div>
            )}
          </div>
        </main>

        <Footer />

        <LeadCaptureModal
          open={showLeadModal}
          onOpenChange={(open) => {
            setShowLeadModal(open);
            if (!open) {
              setIsUnlocked(localStorage.getItem('content_unlocked') === 'true');
            }
          }}
          queryContext={selectedChemical ? `MSDS: ${selectedChemical.name_vi}` : undefined}
          sourcePage="msds"
        />
      </div>
    </ChatProvider>
  );
}
