import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface JobUrlInputProps {
  onUrlSubmit: (url: string) => void;
}

const JobUrlInput = ({ onUrlSubmit }: JobUrlInputProps) => {
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
          />
          <Button type="submit">Analyze</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobUrlInput;