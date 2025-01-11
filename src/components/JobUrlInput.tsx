import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface JobUrlInputProps {
  onUrlSubmit: (url: string) => void;
  isProcessing?: boolean;
}

const JobUrlInput = ({ onUrlSubmit, isProcessing = false }: JobUrlInputProps) => {
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes("104.com.tw")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid 104 job posting URL",
        variant: "destructive",
      });
      return;
    }
    onUrlSubmit(url);
    setUrl("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Job Posting URL</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste 104 job posting URL here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            disabled={isProcessing}
          />
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              'Analyze'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobUrlInput;