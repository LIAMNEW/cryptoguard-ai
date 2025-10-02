import { useState, useCallback } from "react";
import { Upload, File, CheckCircle, AlertCircle, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { encryptWithQuantumSafe, getPublicKey } from "@/lib/quantumCrypto";
import { QuantumSafeIndicator } from "@/components/security/QuantumSafeIndicator";

interface UploadedFile {
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface FileUploadProps {
  onFileUpload: (transactions: any[]) => Promise<void>;
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

    // Process each file
    for (const upload of newUploads) {
      await processFile(upload);
    }
  };

  const processFile = async (upload: UploadedFile) => {
    try {
      console.log('Processing file:', upload.file.name);
      
      // Update progress
      setUploadedFiles(prev => 
        prev.map(file => 
          file.file === upload.file 
            ? { ...file, progress: 20 }
            : file
        )
      );

      // Parse file content
      const text = await upload.file.text();
      let transactions = [];
      
      console.log('File content preview:', text.substring(0, 500));
      
      if (upload.file.name.endsWith('.csv')) {
        transactions = parseCSV(text);
      } else if (upload.file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            transactions = parsed;
          } else if (parsed && typeof parsed === 'object' && parsed.transactions) {
            transactions = parsed.transactions;
          } else {
            // Wrap single object in array
            transactions = [parsed];
          }
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Invalid JSON format');
        }
      }

      console.log('Parsed transactions count:', transactions.length);
      console.log('Sample transaction:', transactions[0]);

      if (transactions.length === 0) {
        throw new Error('No valid transactions found in file. Please check the format.');
      }

      // Update progress
      setUploadedFiles(prev => 
        prev.map(file => 
          file.file === upload.file 
            ? { ...file, progress: 60 }
            : file
        )
      );

      // Encrypt transactions with quantum-safe cryptography
      console.log('Encrypting transactions with quantum-safe cryptography...');
      const publicKey = getPublicKey();
      
      if (!publicKey) {
        throw new Error('Quantum-safe encryption not initialized. Please refresh the page.');
      }

      const encryptedData = await encryptWithQuantumSafe(transactions, publicKey);
      
      setUploadedFiles(prev => 
        prev.map(file => 
          file.file === upload.file 
            ? { ...file, progress: 80 }
            : file
        )
      );

      // Upload encrypted data to backend
      console.log('Uploading encrypted transactions to backend...');
      await onFileUpload([{
        encrypted: true,
        quantumSafe: true,
        data: encryptedData,
        metadata: {
          originalCount: transactions.length,
          encryptedAt: new Date().toISOString(),
          algorithm: 'CRYSTALS-Kyber-1024 + AES-256-GCM'
        }
      }]);

      // Mark as complete
      setUploadedFiles(prev => 
        prev.map(file => 
          file.file === upload.file 
            ? { ...file, status: "success", progress: 100 }
            : file
        )
      );
    } catch (error) {
      console.error('File processing error:', error);
      setUploadedFiles(prev => 
        prev.map(file => 
          file.file === upload.file 
            ? { ...file, status: "error", error: error instanceof Error ? error.message : 'Failed to process file' }
            : file
        )
      );
    }
  };

  const parseCSV = (text: string) => {
    console.log('Parsing CSV text length:', text.length);
    const lines = text.split('\n').filter(line => line.trim());
    console.log('CSV lines count:', lines.length);
    
    if (lines.length < 2) {
      console.log('Not enough lines in CSV');
      return [];
    }
    
    // Better CSV parsing that handles quoted fields
    const parseCSVLine = (line: string) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(field => field.replace(/^"|"$/g, ''));
    };
    
    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    console.log('CSV headers:', headers);
    
    const transactions = lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line);
      const obj: any = {};
      
      headers.forEach((header, i) => {
        if (values[i]) {
          obj[header] = values[i];
        }
      });
      
      // Map common field variations to expected format
      const transaction: any = {
        transaction_id: obj.transaction_id || obj.txid || obj.id || obj.hash || `tx_${Date.now()}_${index}`,
        from_address: obj.from_address || obj.from || obj.sender || obj.source_address || obj.from_addr,
        to_address: obj.to_address || obj.to || obj.recipient || obj.destination_address || obj.to_addr,
        amount: parseFloat(obj.amount || obj.value || obj.sum || obj.total || '0'),
        timestamp: obj.timestamp || obj.time || obj.date || obj.created_at || new Date().toISOString(),
        transaction_hash: obj.transaction_hash || obj.hash || obj.txhash,
        block_number: obj.block_number ? parseInt(obj.block_number) : undefined,
        gas_fee: obj.gas_fee ? parseFloat(obj.gas_fee) : undefined,
        transaction_type: obj.transaction_type || obj.type || 'transfer'
      };
      
      // Ensure timestamp is in ISO format
      if (transaction.timestamp && !transaction.timestamp.includes('T')) {
        try {
          transaction.timestamp = new Date(transaction.timestamp).toISOString();
        } catch (e) {
          transaction.timestamp = new Date().toISOString();
        }
      }
      
      return transaction;
    }).filter(tx => tx.from_address && tx.to_address && tx.amount > 0);
    
    console.log('Parsed transactions:', transactions.length);
    console.log('Sample transaction:', transactions[0]);
    return transactions;
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
      {/* Quantum-Safe Security Indicator */}
      <QuantumSafeIndicator />
      
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
          <div className="relative inline-block mb-4">
            <Upload className={cn(
              "w-16 h-16 mx-auto transition-colors",
              dragActive ? "text-quantum-green" : "text-muted-foreground"
            )} />
            <Shield className="w-6 h-6 absolute -top-1 -right-1 text-quantum-green" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Upload Transaction Data
          </h3>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="outline" className="border-quantum-green text-quantum-green">
              <Shield className="w-3 h-3 mr-1" />
              Quantum-Safe Encrypted
            </Badge>
          </div>
          <p className="text-muted-foreground mb-2">
            Drag and drop your files here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Supports CSV, XLSX, and JSON files up to 50MB
          </p>
          <p className="text-xs text-quantum-green/70">
            🔐 All uploads protected with CRYSTALS-Kyber post-quantum encryption
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
                    <>
                      <div className="w-full bg-glass-border rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-quantum-green h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-quantum-green mt-1">
                        {upload.progress < 30 ? "📄 Parsing..." : 
                         upload.progress < 70 ? "🔐 Encrypting..." : 
                         "📤 Uploading..."}
                      </p>
                    </>
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