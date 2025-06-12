import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlchemyRecords } from "@/hooks/use-alchemy-records";
import { SEO } from "@/components/SEO";
import { H1 } from "@/components/seo/StructuredHeadings";
import UsageStats from "@/components/alchemy-records/UsageStats";
import AnalysisCard from "@/components/alchemy-records/AnalysisCard";
import RecordsPagination from "@/components/alchemy-records/RecordsPagination";
import SortFilterControls from "@/components/alchemy-records/SortFilterControls";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";

const AlchemyRecords = () => {
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

  if (isLoading || loading) {
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
      return "No resume analyses found.";
    }
    if (statusFilter.length === 1) {
      return `No analyses found with status "${statusFilter[0]}".`;
    }
    return `No analyses found with the selected status filters.`;
  };

  return (
    <>
      <SEO
        title="Alchemy Records - Resume Analysis History"
        description="View and manage your resume analysis history. Track your optimization progress, feedback, and improvements with AI-powered insights."
        keywords="resume analysis history, AI optimization tracking, career progress, resume improvements, job application records"
        canonicalUrl="https://resumealchemist.qwizai.com/alchemy-records"
        noIndex={true}
      />
      
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <H1 className="text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
              Alchemy Records
            </H1>

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
