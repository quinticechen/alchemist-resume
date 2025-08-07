import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Building2, Users, TrendingUp, Calendar, ExternalLink } from "lucide-react";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

interface CompanyData {
  id: string;
  status: string;
  company_name: string;
  company_website: string;
  career_page: string;
  founded: string;
  headquarters: string;
  industry: string;
  number_of_employees: string;
  revenue: string;
  ceo: string;
  business_overview: string;
  key_products_services: Array<{name: string; description: string}>;
  main_competitors: string;
  market_share: string;
  competitive_advantages: string;
  stock_performance: string;
  pe_ratio: string;
  growth_rate: string;
  core_values: string;
  work_environment: string;
  employee_benefits: string;
  recent_news: Array<{date: string; headline: string; newsUrl: string}>;
  swot_strengths: string;
  swot_weaknesses: string;
  swot_opportunities: string;
  swot_threats: string;
  updated_at: string;
}

const CompanyResearch = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('company-research');
  const { t: tCommon } = useTranslation('common');
  const { currentLanguage } = useLanguage();
  
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadingOptions = {
    loop: true,
    autoplay: true,
    animationData: Loading,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  useEffect(() => {
    if (!isLoading && !session) {
      navigate("/login", { state: { from: `/company-research/${jobId}` } });
    }
  }, [session, isLoading, navigate, jobId]);

  useEffect(() => {
    if (session && jobId) {
      fetchCompanyData();
    }
  }, [session, jobId]);

  const fetchCompanyData = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        // No company data found, create a pending record
        const { error: insertError } = await supabase
          .from('companies')
          .insert({
            job_id: jobId,
            user_id: session?.user?.id,
            status: 'pending'
          });

        if (insertError) {
          throw insertError;
        }

        setCompanyData({ 
          id: '', 
          status: 'pending',
          company_name: '',
          company_website: '',
          career_page: '',
          founded: '',
          headquarters: '',
          industry: '',
          number_of_employees: '',
          revenue: '',
          ceo: '',
          business_overview: '',
          key_products_services: [],
          main_competitors: '',
          market_share: '',
          competitive_advantages: '',
          stock_performance: '',
          pe_ratio: '',
          growth_rate: '',
          core_values: '',
          work_environment: '',
          employee_benefits: '',
          recent_news: [],
          swot_strengths: '',
          swot_weaknesses: '',
          swot_opportunities: '',
          swot_threats: '',
          updated_at: ''
        });

        // Set up polling for updates
        startPolling();
      } else {
        setCompanyData(data);
        if (data.status === 'pending') {
          startPolling();
        }
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError(t('error.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('job_id', jobId)
          .eq('user_id', session?.user?.id)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.status === 'completed') {
          setCompanyData(data);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds

    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="w-64 h-64">
          <Lottie options={loadingOptions} />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center">
  //       <div className="text-center">
  //         <h2 className="text-2xl font-bold text-red-600 mb-4">{t('error.title')}</h2>
  //         <p className="text-gray-600 mb-4">{error}</p>
  //         <Button onClick={() => navigate(-1)}>
  //           <ArrowLeft className="h-4 w-4 mr-2" />
  //           {tCommon('goBack')}
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  const renderPendingState = () => (
    <div className="text-center py-12">
      <div className="w-32 h-32 mx-auto mb-6">
        <Lottie options={loadingOptions} />
      </div>
      <h2 className="text-2xl font-bold mb-4">{t('pending.title')}</h2>
      <p className="text-gray-600 mb-4">{t('pending.description')}</p>
      <p className="text-sm text-gray-500">{t('pending.waitTime')}</p>
    </div>
  );

  const renderCompanyContent = () => {
    if (!companyData || companyData.status === 'pending') {
      return renderPendingState();
    }

    return (
      <div className="space-y-6">
        {/* Company Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Building2 className="h-6 w-6" />
                  {companyData.company_name || t('unknown.company')}
                </CardTitle>
                <p className="text-gray-600 mt-1">{companyData.industry}</p>
              </div>
              <Badge variant="secondary">{companyData.founded}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{companyData.number_of_employees} {t('employees')}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{companyData.revenue}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{t('ceo')}: {companyData.ceo}</span>
              </div>
            </div>
            
            {companyData.company_website && (
              <div className="mt-4">
                <Button variant="outline" size="sm" onClick={() => window.open(companyData.company_website, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('visitWebsite')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Overview */}
        {companyData.business_overview && (
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.businessOverview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{companyData.business_overview}</p>
            </CardContent>
          </Card>
        )}

        {/* Key Products & Services */}
        {companyData.key_products_services && companyData.key_products_services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.keyProducts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companyData.key_products_services.map((product, index) => (
                  <div key={index} className="border-l-4 border-primary pl-4">
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-gray-600 text-sm">{product.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SWOT Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.swotAnalysis')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companyData.swot_strengths && (
                <div>
                  <h4 className="font-semibold text-green-700 mb-2">{t('swot.strengths')}</h4>
                  <p className="text-sm text-gray-700">{companyData.swot_strengths}</p>
                </div>
              )}
              {companyData.swot_weaknesses && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">{t('swot.weaknesses')}</h4>
                  <p className="text-sm text-gray-700">{companyData.swot_weaknesses}</p>
                </div>
              )}
              {companyData.swot_opportunities && (
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2">{t('swot.opportunities')}</h4>
                  <p className="text-sm text-gray-700">{companyData.swot_opportunities}</p>
                </div>
              )}
              {companyData.swot_threats && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-2">{t('swot.threats')}</h4>
                  <p className="text-sm text-gray-700">{companyData.swot_threats}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent News */}
        {companyData.recent_news && companyData.recent_news.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('sections.recentNews')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companyData.recent_news.map((news, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Calendar className="h-4 w-4 text-gray-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">{news.date}</p>
                      <h4 className="font-medium">{news.headline}</h4>
                      {news.newsUrl && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto"
                          onClick={() => window.open(news.newsUrl, '_blank')}
                        >
                          {t('readMore')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <>
      <SEO
        title={t('meta.title')}
        description={t('meta.description')}
        keywords={t('meta.keywords')}
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/${currentLanguage}/alchemy-records`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {tCommon('goBack')}
              </Button>
              <h1 className="text-3xl font-bold bg-gradient-primary text-transparent bg-clip-text">
                {t('title')}
              </h1>
            </div>

            {renderCompanyContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default CompanyResearch;