
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StyleOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

const styleOptions: StyleOption[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and formal layout",
    preview: "Elegant typography with proper spacing"
  },
  {
    id: "modern",
    name: "Modern", 
    description: "Contemporary design with subtle colors",
    preview: "Sleek design with modern typography"
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold and expressive layout",
    preview: "Dynamic layout with creative elements"
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Simple and clean design",
    preview: "Clean lines with minimal decoration"
  }
];

interface CoverLetterStyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (styleId: string) => void;
}

const CoverLetterStyleSelector = ({ selectedStyle, onStyleChange }: CoverLetterStyleSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cover Letter Style</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {styleOptions.map((style) => (
            <Button
              key={style.id}
              variant={selectedStyle === style.id ? "default" : "outline"}
              className={`h-auto p-4 text-left justify-start ${
                selectedStyle === style.id
                  ? "bg-gradient-primary text-white"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => onStyleChange(style.id)}
            >
              <div>
                <div className="font-medium text-sm">{style.name}</div>
                <div className="text-xs opacity-75 mt-1">{style.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CoverLetterStyleSelector;
