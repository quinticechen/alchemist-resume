
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAlchemyRecords } from "@/hooks/use-alchemy-records";
import UsageStats from "@/components/alchemy-records/UsageStats";
import AnalysisCard from "@/components/alchemy-records/AnalysisCard";
import RecordsPagination from "@/components/alchemy-records/RecordsPagination";
import SortFilterControls from "@/components/alchemy-records/SortFilterControls";
import Lottie from "react-lottie";
import Loading from "@/animations/Loading.json";
import SeekerDialog from "@/components/SeekerDialog";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-primary text-transparent bg-clip-text">
            Alchemy Records
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
              />
            ))}
          </div>

          {analyses.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {statusFilter === "all" 
                  ? "No resume analyses found." 
                  : `No analyses found with status "${statusFilter}".`
                }
              </p>
            </div>
          )}

          <RecordsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
      {/* <SeekerDialog position="bottom" /> */}
    </div>
  );
};

export default AlchemyRecords;
