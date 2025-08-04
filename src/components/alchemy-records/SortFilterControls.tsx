
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter, ArrowUpDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export type SortOption = 
  | "created_at_desc" 
  | "created_at_asc" 
  | "last_edit_desc" 
  | "last_edit_asc" 
  | "status_asc" 
  | "status_desc";

export type StatusFilter = 
  | "all" 
  | "resume" 
  | "cover_letter" 
  | "application_submitted" 
  | "following_up" 
  | "interview" 
  | "rejected" 
  | "accepted";

interface SortFilterControlsProps {
  currentSort: SortOption;
  currentFilter: StatusFilter[];
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: StatusFilter[]) => void;
}

const SortFilterControls = ({ 
  currentSort, 
  currentFilter, 
  onSortChange, 
  onFilterChange
}: SortFilterControlsProps) => {
  const { t } = useTranslation('records');

  const sortOptions = [
    { value: "created_at_desc" as SortOption, label: t('sorting.resumeGenerationLatest') },
    { value: "created_at_asc" as SortOption, label: t('sorting.resumeGenerationEarliest') },
    { value: "last_edit_desc" as SortOption, label: t('sorting.lastEditLatest') },
    { value: "last_edit_asc" as SortOption, label: t('sorting.lastEditEarliest') },
    { value: "status_asc" as SortOption, label: t('sorting.statusAscending') },
    { value: "status_desc" as SortOption, label: t('sorting.statusDescending') },
  ];
  
  const filterOptions = [
    { value: "all" as StatusFilter, label: t('filters.allStatuses') },
    { value: "resume" as StatusFilter, label: t('status.resume') },
    { value: "cover_letter" as StatusFilter, label: t('status.coverLetter') },
    { value: "application_submitted" as StatusFilter, label: t('status.applicationSubmitted') },
    { value: "following_up" as StatusFilter, label: t('status.followingUp') },
    { value: "interview" as StatusFilter, label: t('status.interview') },
    { value: "rejected" as StatusFilter, label: t('status.rejected') },
    { value: "accepted" as StatusFilter, label: t('status.accepted') },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resume":
        return "bg-blue-100 text-blue-800";
      case "cover_letter":
        return "bg-green-100 text-green-800";
      case "application_submitted":
        return "bg-purple-100 text-purple-800";
      case "following_up":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const getCurrentSortLabel = () => {
    return sortOptions.find(option => option.value === currentSort)?.label || "Sort by";
  };

  const handleFilterToggle = (filterValue: StatusFilter) => {
    if (filterValue === "all") {
      onFilterChange(["all"]);
      return;
    }

    let newFilters = [...currentFilter];
    
    // Remove "all" if it exists when selecting specific filters
    if (newFilters.includes("all")) {
      newFilters = newFilters.filter(f => f !== "all");
    }

    if (newFilters.includes(filterValue)) {
      // Remove the filter if it's already selected
      newFilters = newFilters.filter(f => f !== filterValue);
      // If no filters left, set to "all"
      if (newFilters.length === 0) {
        newFilters = ["all"];
      }
    } else {
      // Add the filter
      newFilters.push(filterValue);
    }

    onFilterChange(newFilters);
  };

  const removeFilter = (filterToRemove: StatusFilter) => {
    const newFilters = currentFilter.filter(f => f !== filterToRemove);
    if (newFilters.length === 0) {
      onFilterChange(["all"]);
    } else {
      onFilterChange(newFilters);
    }
  };

  const getFilterButtonLabel = () => {
    if (currentFilter.includes("all")) {
      return t('filters.allStatuses');
    }
    if (currentFilter.length === 1) {
      const option = filterOptions.find(opt => opt.value === currentFilter[0]);
      return option?.label || "Filter";
    }
    return `${currentFilter.length} ${t('filters.filtersSelected')}`;
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-4">
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              {getCurrentSortLabel()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {sortOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={currentSort === option.value ? "bg-gray-100" : ""}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {getFilterButtonLabel()}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {filterOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleFilterToggle(option.value)}
                className={currentFilter.includes(option.value) ? "bg-gray-100" : ""}
              >
                <div className="flex items-center gap-2">
                  {option.value === "all" ? (
                    option.label
                  ) : (
                    <Badge variant="outline" className={getStatusColor(option.value)}>
                      {option.label}
                    </Badge>
                  )}
                  {currentFilter.includes(option.value) && (
                    <span className="ml-auto text-blue-600">✓</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selected Filters Display */}
      {!currentFilter.includes("all") && currentFilter.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 flex items-center">{t('filters.activeFilters')}:</span>
          {currentFilter.map((filter) => {
            const option = filterOptions.find(opt => opt.value === filter);
            return (
              <Badge 
                key={filter} 
                variant="outline" 
                className={`${getStatusColor(filter)} flex items-center gap-1`}
              >
                {option?.label}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SortFilterControls;
