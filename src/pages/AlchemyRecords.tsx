import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlchemyRecords } from "@/hooks/use-alchemy-records";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

import UsageStats from "@/components/alchemy-records/UsageStats";
import AnalysisCard from "@/components/alchemy-records/AnalysisCard";
import RecordsPagination from "@/components/alchemy-records/RecordsPagination";
import SortFilterControls from "@/components/alchemy-records/SortFilterControls";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

const AlchemyRecords = () => {
  const { t, ready } = useTranslation(['common', 'records']);
  
  // Debug: Log translation readiness
  console.log('Translation ready:', ready, 'Language:', i18n?.language);
  console.log('Available namespaces:', i18n?.options?.ns);
  console.log('Loaded resources:', Object.keys(i18n?.store?.data || {}));
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const {
    analyses,
    loading,
    currentPage,
    totalPages,
    editingId,
    usageCount,
    sortOption,
    statusFilter,
    setCurrentPage,
    setEditingId,
    setSortOption,
    setStatusFilter,
    handleSaveTitle,
    handleFeedback,
    refreshData,
  } = useAlchemyRecords();

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
      navigate("/login", { state: { from: "/alchemy-records" } });
    }
  }, [session, isLoading, navigate]);

  if (isLoading || loading || !ready) {
    return (
      <div className="w-64 h-64 mx-auto">
        <Lottie options={loadingOptions} />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const getFilterDescription = () => {
    if (statusFilter.includes("all")) {
      return t('records:messages.noAnalysesFound');
    }
    if (statusFilter.length === 1) {
      return `${t('records:messages.noAnalysesWithStatus')} "${statusFilter[0]}".`;
    }
    return t('records:messages.noAnalysesWithFilters');
  };

  return (
    <>
      <SEO
        title={t('records:meta.title')}
        description={t('records:meta.description')}
        keywords={t('records:meta.keywords')}
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-center text-4xl font-bold mb-4 bg-gradient-primary text-transparent bg-clip-text">
              {t('records:title')}
            </h1>

            <UsageStats usageCount={usageCount} />

            <SortFilterControls
              currentSort={sortOption}
              currentFilter={statusFilter}
              onSortChange={setSortOption}
              onFilterChange={setStatusFilter}
            />

            <div className="space-y-6">
              {analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  {...analysis}
                  editingId={editingId}
                  onStartEditing={setEditingId}
                  onSaveTitle={handleSaveTitle}
                  onCancelEditing={() => setEditingId(null)}
                  onFeedback={handleFeedback}
                  onStatusChange={refreshData}
                />
              ))}
            </div>

            {analyses.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-600">{getFilterDescription()}</p>
              </div>
            )}

            <RecordsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AlchemyRecords;
