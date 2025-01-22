import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const ProcessingPreview = () => {
  return (
    <Card className="w-full animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Processing Resume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Progress value={33} className="h-2" />
          <p className="text-sm text-gray-600">
            Your resume is being analyzed. This may take a few minutes...
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingPreview;