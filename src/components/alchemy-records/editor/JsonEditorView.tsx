
import React from 'react';
import { Textarea } from "@/components/ui/textarea";

interface JsonEditorViewProps {
  resumeData: any;
  onChange: (json: string) => void;
}

const JsonEditorView: React.FC<JsonEditorViewProps> = ({ resumeData, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const parsed = JSON.parse(e.target.value);
      onChange(parsed);
    } catch (error) {
      console.error("Invalid JSON:", error);
    }
  };
  
  return (
    <div className="flex-1 p-4 overflow-auto">
      <Textarea
        className="h-full font-mono text-sm"
        value={JSON.stringify(resumeData, null, 2)}
        onChange={handleChange}
      />
    </div>
  );
};

export default JsonEditorView;
