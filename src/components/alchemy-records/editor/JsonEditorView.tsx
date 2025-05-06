
import React, { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface JsonEditorViewProps {
  resumeData: any;
  onChange: (json: any) => void;
}

const JsonEditorView: React.FC<JsonEditorViewProps> = ({ resumeData, onChange }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      const formattedJson = JSON.stringify(resumeData, null, 2);
      setJsonText(formattedJson);
      setError(null);
    } catch (err) {
      console.error("Error formatting JSON:", err);
      setError("Error formatting JSON");
    }
  }, [resumeData]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setJsonText(newValue);
    
    try {
      const parsed = JSON.parse(newValue);
      onChange(parsed);
      setError(null);
    } catch (err) {
      setError("Invalid JSON syntax");
      // Don't update the data until syntax is valid
    }
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 p-4 h-full">
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 mb-2 text-sm">
            {error}
          </div>
        )}
        <textarea
          className="h-full w-full font-mono text-sm p-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          value={jsonText}
          onChange={handleChange}
          spellCheck="false"
          style={{ height: "calc(100% - 20px)" }}
        />
      </div>
    </ScrollArea>
  );
};

export default JsonEditorView;
