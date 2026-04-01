'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Package,
  Scale,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Download,
  Search,
  Lock,
  LogIn,
} from 'lucide-react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ChatProvider } from '@/components/chat/chat-context';
import { useLanguage } from '@/lib/i18n/context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Chemical2026 {
  id: string;
  cas_number: string;
  vietnamese_name: string;
  english_name: string;
  decree_24_appendix: string;
  requires_incident_plan: boolean;
  threshold_mass_kg: number;
  import_declaration_required: boolean;
  special_control: boolean;
  legal_reference: string;
}

export default function ImportDeclarationPage() {
  const { t, language } = useLanguage();
  const td = t.declaration;
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [chemicals, setChemicals] = useState<Chemical2026[]>([]);
  const [selectedChemical, setSelectedChemical] = useState<Chemical2026 | null>(null);
  const [volume, setVolume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const isAuthenticated = !!user;

  const STEPS = [
    { id: 1, label: td.step1Label, icon: Package },
    { id: 2, label: td.step2Label, icon: Scale },
    { id: 3, label: td.step3Label, icon: FileText },
  ];

  const searchChemicals = useCallback(async (query: string) => {
    if (query.length < 2) { setChemicals([]); return; }
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('chemicals_2026')
        .select('*')
        .or(`vietnamese_name.ilike.%${query}%,english_name.ilike.%${query}%,cas_number.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      setChemicals(data || []);
    } catch {
      setChemicals([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) { searchChemicals(searchQuery); } else { setChemicals([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchChemicals]);

  const calculateResult = () => {
    if (!selectedChemical || !volume) return null;
    const volumeNum = parseFloat(volume);
    const threshold = selectedChemical.threshold_mass_kg || 0;
    return {
      requiresDeclaration: selectedChemical.import_declaration_required,
      requiresPlan: selectedChemical.requires_incident_plan && volumeNum >= threshold,
      threshold,
      volumeNum,
      legalRef: selectedChemical.legal_reference,
      appendix: selectedChemical.decree_24_appendix,
    };
  };

  const result = currentStep === 3 ? calculateResult() : null;
  const canProceed = () => {
    if (currentStep === 1) return !!selectedChemical;
    if (currentStep === 2) return !!volume && parseFloat(volume) > 0;
    return true;
  };

  return (
    <ChatProvider>
      <div className="min-h-screen bg-slate-50">
        <Header />

        <main className="pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Page header */}
            <div className="mb-8">
              <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-cyan-600 mb-4">
                <ChevronLeft className="w-4 h-4" />
                {td.backHome}
              </Link>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{td.pageTitle}</h1>
                  <p className="text-slate-600">{td.pageSubtitle}</p>
                </div>
              </div>
              <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 mt-2">{td.badge}</Badge>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-between mb-8">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      currentStep >= step.id ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden md:inline">{step.label}</span>
                    <span className="text-sm font-medium md:hidden">{step.id}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 md:w-16 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-cyan-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <CardTitle className="mb-2">{td.step1Title}</CardTitle>
                      <CardDescription>{td.step1Desc}</CardDescription>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={td.searchPlaceholder}
                        className="pl-10 h-12"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                      )}
                    </div>

                    {chemicals.length > 0 && (
                      <div className="border rounded-lg divide-y max-h-80 overflow-auto">
                        {chemicals.map((chemical) => (
                          <button
                            key={chemical.id}
                            onClick={() => { setSelectedChemical(chemical); setSearchQuery(chemical.vietnamese_name); }}
                            className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                              selectedChemical?.id === chemical.id ? 'bg-cyan-50 border-l-4 border-l-cyan-600' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">{chemical.vietnamese_name}</p>
                                <p className="text-sm text-slate-500">
                                  {chemical.english_name} {chemical.cas_number && `| ${chemical.cas_number}`}
                                </p>
                              </div>
                              <Badge variant={chemical.special_control ? 'destructive' : 'secondary'} className="text-xs">
                                {td.appendixLabel} {chemical.decree_24_appendix}
                              </Badge>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedChemical && (
                      <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-100">
                        <p className="text-sm text-cyan-600 mb-1">{td.selectedLabel}</p>
                        <p className="font-semibold text-cyan-800">{selectedChemical.vietnamese_name}</p>
                        <p className="text-sm text-cyan-600">
                          {td.appendixLabel} {selectedChemical.decree_24_appendix} — Nghị định 24/2026
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && selectedChemical && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <CardTitle className="mb-2">{td.step2Title}</CardTitle>
                      <CardDescription>{td.step2Desc}</CardDescription>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-500">{td.selectedLabel}</p>
                      <p className="font-semibold text-slate-900">{selectedChemical.vietnamese_name}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="volume">{td.volumeLabel}</Label>
                      <Input
                        id="volume"
                        type="number"
                        value={volume}
                        onChange={(e) => setVolume(e.target.value)}
                        placeholder={td.volumePlaceholder}
                        min="0"
                        className="h-12 text-lg"
                      />
                      {selectedChemical.threshold_mass_kg && (
                        <p className="text-sm text-slate-500">
                          {td.thresholdLabel} {selectedChemical.threshold_mass_kg.toLocaleString()} kg
                        </p>
                      )}
                    </div>

                    {volume && parseFloat(volume) > 0 && selectedChemical.threshold_mass_kg && (
                      <div className={`p-4 rounded-lg border ${
                        parseFloat(volume) >= selectedChemical.threshold_mass_kg
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        {parseFloat(volume) >= selectedChemical.threshold_mass_kg ? (
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-700">{td.aboveThreshold}</p>
                              <p className="text-sm text-yellow-600">
                                {td.aboveThresholdDesc
                                  .replace('{vol}', parseFloat(volume).toLocaleString())
                                  .replace('{threshold}', selectedChemical.threshold_mass_kg.toLocaleString())}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-700">{td.belowThreshold}</p>
                              <p className="text-sm text-green-600">
                                {td.belowThresholdDesc
                                  .replace('{vol}', parseFloat(volume).toLocaleString())
                                  .replace('{threshold}', selectedChemical.threshold_mass_kg.toLocaleString())}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && result && selectedChemical && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <CardTitle className="mb-2">{td.step3Title}</CardTitle>
                      <CardDescription>{td.step3Desc}</CardDescription>
                    </div>

                    <div className="space-y-4">
                      {/* Declaration status */}
                      <div className={`p-6 rounded-xl border-2 ${result.requiresDeclaration ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          {result.requiresDeclaration
                            ? <AlertTriangle className="w-8 h-8 text-red-600" />
                            : <CheckCircle className="w-8 h-8 text-green-600" />}
                          <div>
                            <p className={`text-2xl font-bold ${result.requiresDeclaration ? 'text-red-700' : 'text-green-700'}`}>
                              {result.requiresDeclaration ? td.requiresDeclaration : td.noDeclaration}
                            </p>
                            <p className={`text-sm ${result.requiresDeclaration ? 'text-red-600' : 'text-green-600'}`}>
                              {td.legalRef}
                            </p>
                          </div>
                        </div>
                        {result.requiresDeclaration && (
                          <div className="mt-4 p-4 bg-white/50 rounded-lg">
                            <p className="font-medium text-red-700 mb-2">{td.deadlineLabel}</p>
                            <p className="text-red-600">{td.deadlineValue}</p>
                          </div>
                        )}
                      </div>

                      {/* Emergency plan warning */}
                      {result.requiresPlan && (
                        <div className="p-5 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="font-semibold text-yellow-700">
                                {language === 'vi'
                                  ? 'Bắt buộc lập Kế hoạch Phòng ngừa Ứng phó Sự cố'
                                  : 'Incident Response Plan Required'}
                              </p>
                              <p className="text-sm text-yellow-600 mt-1">
                                {language === 'vi'
                                  ? `Theo Điều 37, Luật Hóa chất 69/2025. Khối lượng ${result.volumeNum.toLocaleString()} kg vượt ngưỡng ${result.threshold.toLocaleString()} kg.`
                                  : `Per Article 37, Chemical Law 69/2025. Volume ${result.volumeNum.toLocaleString()} kg exceeds threshold ${result.threshold.toLocaleString()} kg.`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Chemical info */}
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm text-slate-500 mb-2">{td.chemInfoLabel}</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-500">{td.nameLabel}</span>
                            <span className="ml-2 font-medium">{selectedChemical.vietnamese_name}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">{td.appendixLabel}:</span>
                            <span className="ml-2 font-medium">{result.appendix}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">{td.volumeResultLabel}</span>
                            <span className="ml-2 font-medium">{result.volumeNum.toLocaleString()} kg</span>
                          </div>
                          <div>
                            <span className="text-slate-500">{td.thresholdResultLabel}</span>
                            <span className="ml-2 font-medium">{result.threshold.toLocaleString()} kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Legal source */}
                      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-lg">
                        <p className="text-xs text-cyan-600 mb-1">{td.sourceLabel}</p>
                        <p className="text-sm font-medium text-cyan-800">[{result.legalRef}]</p>
                      </div>

                      {/* CTA buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          onClick={() => {
                            if (isAuthenticated) {
                              alert(language === 'vi' ? 'Chức năng tải xuống đang được phát triển' : 'Download functionality is under development');
                            } else {
                              setShowLoginPrompt(true);
                            }
                          }}
                          className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          {isAuthenticated ? (
                            <><Download className="w-4 h-4 mr-2" />{td.downloadBtn}</>
                          ) : (
                            <><LogIn className="w-4 h-4 mr-2" />{td.loginToDownload}</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { if (isAuthenticated) { router.push('/lien-he'); } else { setShowLoginPrompt(true); } }}
                          className="flex-1"
                        >
                          {td.supportBtn}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {td.back}
                  </Button>

                  {currentStep < 3 && (
                    <Button
                      onClick={() => setCurrentStep(s => Math.min(3, s + 1))}
                      disabled={!canProceed() || isLoading}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>{td.next}<ChevronRight className="w-4 h-4" /></>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />

        <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-cyan-600" />
                {td.loginTitle}
              </DialogTitle>
              <DialogDescription className="pt-4">{td.loginDesc}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => router.push('/dang-nhap')} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white" size="lg">
                <LogIn className="w-4 h-4 mr-2" />
                {td.loginBtn}
              </Button>
              <Button onClick={() => router.push('/dang-ky')} variant="outline" className="w-full border-cyan-600 text-cyan-600 hover:bg-cyan-50" size="lg">
                {td.registerBtn}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-slate-500 text-center">{td.freeAccountIncludes}</p>
              <ul className="mt-2 text-xs text-slate-600 space-y-1">
                {[td.benefit1, td.benefit2, td.benefit3].map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1 h-1 bg-cyan-600 rounded-full" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ChatProvider>
  );
}
