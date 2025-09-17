import { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
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

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['.csv', '.xlsx', '.json'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension) && file.size <= 50 * 1024 * 1024; // 50MB limit
    });

    if (validFiles.length === 0) {
      alert("Please upload valid CSV, XLSX, or JSON files under 50MB");
      return;
    }

    const newUploads: UploadedFile[] = validFiles.map(file => ({
      file,
      status: "uploading",
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newUploads]);

    // Simulate file processing
    newUploads.forEach((upload, index) => {
      simulateUpload(upload, index);
    });

    onFileUpload(validFiles);
  };

  const simulateUpload = (upload: UploadedFile, index: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFiles(prev => 
          prev.map(file => 
            file.file === upload.file 
              ? { ...file, status: "success", progress: 100 }
              : file
          )
        );
      } else {
        setUploadedFiles(prev => 
          prev.map(file => 
            file.file === upload.file 
              ? { ...file, progress }
              : file
          )
        );
      }
    }, 200);
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(upload => upload.file !== fileToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className={cn(
        "glass-card p-8 border-2 border-dashed transition-all duration-300 cursor-pointer",
        dragActive 
          ? "border-quantum-green bg-quantum-green/5 glow-effect" 
          : "border-glass-border hover:border-quantum-green/50"
      )}>
        <div
          className="text-center"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={cn(
            "w-16 h-16 mx-auto mb-4 transition-colors",
            dragActive ? "text-quantum-green" : "text-muted-foreground"
          )} />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Upload Transaction Data
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your files here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Supports CSV, XLSX, and JSON files up to 50MB
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".csv,.xlsx,.json"
            onChange={(e) => e.target.files && handleFiles(Array.from(e.target.files))}
            className="hidden"
          />
        </div>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="glass-card p-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Uploaded Files</h4>
          <div className="space-y-3">
            {uploadedFiles.map((upload, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-glass-background">
                <File className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(upload.file.size)}
                  </p>
                  {upload.status === "uploading" && (
                    <div className="w-full bg-glass-border rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-quantum-green h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {upload.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-quantum-green" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(upload.file)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}