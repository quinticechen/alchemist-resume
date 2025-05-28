
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatusSelectorProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

const statusOptions = [
  { value: "resume", label: "Resume" },
  { value: "cover_letter", label: "Cover Letter" },
  { value: "application_submitted", label: "Application Submitted" },
  { value: "following_up", label: "Following Up" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "resume":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "cover_letter":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "application_submitted":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    case "following_up":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "interview":
      return "bg-orange-100 text-orange-800 hover:bg-orange-200";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 hover:bg-emerald-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getStatusLabel = (status: string) => {
  const option = statusOptions.find(opt => opt.value === status);
  return option ? option.label : "Resume";
};

const StatusSelector = ({ currentStatus, onStatusChange, disabled }: StatusSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          className={`${getStatusColor(currentStatus)} border-0 h-auto p-2 font-medium text-xs cursor-pointer`}
        >
          {getStatusLabel(currentStatus)}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={currentStatus === option.value ? "bg-gray-100" : ""}
          >
            <Badge variant="outline" className={getStatusColor(option.value)}>
              {option.label}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default StatusSelector;
