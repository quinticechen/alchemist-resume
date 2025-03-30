
import React, { useState, useEffect } from 'react';
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
  
  // Update the editingTitle when the title prop changes
  useEffect(() => {
    setEditingTitle(title);
  }, [title]);

  const handleSave = () => {
    if (editingTitle.trim()) {
      onSave(editingTitle);
    } else {
      setEditingTitle(title);
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditingTitle(title);
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-sm"
          autoFocus
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setEditingTitle(title);
            onCancel();
          }}
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
