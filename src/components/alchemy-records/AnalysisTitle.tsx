import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";

interface AnalysisTitleProps {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (title: string) => void;
  onCancel: () => void;
}

const AnalysisTitle = ({ title, isEditing, onEdit, onSave, onCancel }: AnalysisTitleProps) => {
  const [editingTitle, setEditingTitle] = useState(title);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSave(editingTitle)}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h3 className="font-semibold text-lg">
        {title || 'Untitled Position'}
      </h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default AnalysisTitle;