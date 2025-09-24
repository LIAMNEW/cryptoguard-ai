import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { uploadTransactions } from "@/lib/supabase";
import { toast } from "sonner";

const Index = () => {
  const [activeSection, setActiveSection] = useState("upload");
  const [hasData, setHasData] = useState(false);

  const handleFileUpload = async (transactions: any[]) => {
    try {
      const result = await uploadTransactions(transactions);
      toast.success(`${transactions.length} transactions uploaded and analyzed successfully!`);
      setHasData(true);
      setActiveSection("dashboard");
    } catch (error) {
      toast.error('Failed to upload transactions. Please try again.');
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="flex">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        <MainContent 
          activeSection={activeSection}
          hasData={hasData}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default Index;
