
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const StatusSelector = ({ currentStatus, onStatusChange, disabled }: StatusSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Application Status</label>
      <Select value={currentStatus} onValueChange={onStatusChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StatusSelector;
