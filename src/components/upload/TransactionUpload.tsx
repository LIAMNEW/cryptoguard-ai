import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TransactionUploadProps {
  onFileUpload: (data: { fileContent: string; fileName: string }) => Promise<any>;
}

interface UploadedFile {
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function TransactionUpload({ onFileUpload }: TransactionUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['.csv', '.json', '.txt'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length === 0) {
      alert('Please upload CSV, JSON, or TXT files only');
      return;
    }

    for (const file of validFiles) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    const fileEntry: UploadedFile = {
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0
    };

    setUploadedFiles(prev => [...prev, fileEntry]);

    try {
      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      // Update progress
      setUploadedFiles(prev => 
        prev.map(f => f.name === file.name ? { ...f, progress: 50 } : f)
      );

      // Process the file
      await onFileUpload({
        fileContent: content,
        fileName: file.name
      });

      // Success
      setUploadedFiles(prev =>
        prev.map(f => 
          f.name === file.name 
            ? { ...f, status: 'success', progress: 100 }
            : f
        )
      );
    } catch (error) {
      console.error('File upload error:', error);
      setUploadedFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? { 
                ...f, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : f
        )
      );
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-quantum-green" />
            Upload Transaction Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-all",
              dragActive 
                ? "border-quantum-green bg-quantum-green/10" 
                : "border-glass-border hover:border-quantum-green/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className={cn(
              "w-16 h-16 mx-auto mb-4",
              dragActive ? "text-quantum-green" : "text-muted-foreground"
            )} />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Supports CSV, JSON, and TXT files
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".csv,.json,.txt"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(Array.from(e.target.files));
                }
              }}
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              variant="outline"
              className="border-quantum-green text-quantum-green hover:bg-quantum-green hover:text-background"
            >
              Select Files
            </Button>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-glass-border"
                >
                  <FileText className="w-5 h-5 text-quantum-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1" />
                    )}
                    {file.status === 'error' && file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-quantum-green" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.name)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
