import { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, X, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onFileUpload: (data: { fileContent: string; fileName: string }) => Promise<any>;
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

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/json'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = validTypes.includes(file.type) || ['.csv', '.xlsx', '.json'].includes(extension);
      const isValidSize = file.size <= 50 * 1024 * 1024;
      
      if (!isValidType) {
        toast.error(`${file.name}: Invalid file type`);
      }
      if (!isValidSize) {
        toast.error(`${file.name}: File too large (max 50MB)`);
      }
      
      return isValidType && isValidSize;
    });

    if (validFiles.length === 0) return;

    const newUploads: UploadedFile[] = validFiles.map(file => ({
      file,
      status: "uploading",
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newUploads]);

    // Process each file sequentially
    for (let i = 0; i < newUploads.length; i++) {
      await processFile(newUploads[i]);
    }
  };

  const processFile = async (upload: UploadedFile) => {
    try {
      console.log('🔄 Processing file:', upload.file.name);
      
      // Update progress - reading
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file.name === upload.file.name 
            ? { ...f, progress: 20 }
            : f
        )
      );

      // Read file content
      const fileContent = await upload.file.text();
      console.log('✅ File read:', upload.file.name, 'Size:', fileContent.length);

      // Update progress - uploading
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file.name === upload.file.name 
            ? { ...f, progress: 50 }
            : f
        )
      );

      // Call the upload handler
      const result = await onFileUpload({
        fileContent,
        fileName: upload.file.name
      });

      console.log('📊 Upload result:', result);

      // Update progress - analyzing
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file.name === upload.file.name 
            ? { ...f, progress: 90 }
            : f
        )
      );

      // Mark as complete
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file.name === upload.file.name 
            ? { ...f, status: "success", progress: 100 }
            : f
        )
      );

      toast.success(`✅ ${upload.file.name} uploaded and analyzed successfully`);
    } catch (error) {
      console.error('❌ File processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.file.name === upload.file.name 
            ? { ...f, status: "error", error: errorMessage }
            : f
        )
      );

      toast.error(`Failed to process ${upload.file.name}: ${errorMessage}`);
    }
  };


  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(f => f.file.name !== fileName));
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
      {/* Quantum-Safe Security Indicator */}
      <Card className="glass-card p-6 border-quantum-green/30">
        <div className="flex items-start gap-4">
          <Shield className="w-6 h-6 text-quantum-green mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">🔐 Quantum-Ready Infrastructure</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ HTTPS + TLS 1.3 encryption</p>
              <p>✅ Post-quantum cryptography ready (ML-KEM)</p>
              <p>✅ AES-256-GCM symmetric encryption</p>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Upload Zone */}
      <Card className={cn(
        "glass-card p-8 border-2 border-dashed transition-all duration-300 cursor-pointer",
        dragActive 
          ? "border-quantum-green bg-quantum-green/5 glow-effect" 
          : "border-glass-border hover:border-quantum-green/50"
      )}>
        <div
          className="text-center space-y-4"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="relative inline-block">
            <Upload className={cn(
              "w-16 h-16 mx-auto transition-colors",
              dragActive ? "text-quantum-green" : "text-muted-foreground"
            )} />
            <Shield className="w-6 h-6 absolute -top-1 -right-1 text-quantum-green" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold text-foreground mb-2">
              Upload Transaction Data
            </h3>
            <p className="text-muted-foreground mb-1">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              CSV, XLSX, or JSON • Max 50MB per file
            </p>
          </div>
          <Badge className="bg-quantum-green text-background">
            🔒 TLS 1.3 Encrypted
          </Badge>
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
          <h4 className="text-lg font-semibold text-foreground mb-4">📁 Upload Status</h4>
          <div className="space-y-3">
            {uploadedFiles.map((upload) => (
              <div key={upload.file.name} className="flex items-center gap-3 p-4 rounded-lg bg-glass-background border border-glass-border hover:border-quantum-green/50 transition-colors">
                <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground ml-2">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                  
                  {upload.status === "uploading" && (
                    <>
                      <div className="w-full bg-glass-border rounded-full h-2 mb-1">
                        <div 
                          className="bg-gradient-to-r from-quantum-green to-quantum-green/60 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-quantum-green">
                        {upload.progress < 30 ? "📄 Reading..." : 
                         upload.progress < 60 ? "📤 Uploading..." : 
                         upload.progress < 90 ? "🔍 Analyzing..." : 
                         "✅ Finalizing..."}
                      </p>
                    </>
                  )}

                  {upload.status === "error" && (
                    <p className="text-xs text-red-400">{upload.error}</p>
                  )}

                  {upload.status === "success" && (
                    <p className="text-xs text-quantum-green">✅ Successfully processed</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {upload.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-quantum-green" />
                  )}
                  {upload.status === "uploading" && (
                    <Loader2 className="w-5 h-5 text-quantum-green animate-spin" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {upload.status !== "uploading" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(upload.file.name)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}