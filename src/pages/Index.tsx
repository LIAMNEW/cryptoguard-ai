import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";

const Index = () => {
  const [activeSection, setActiveSection] = useState("upload");
  const [hasData, setHasData] = useState(false);

  const handleFileUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
    // Simulate processing and show analysis after upload
    setTimeout(() => {
      setHasData(true);
      setActiveSection("dashboard");
    }, 2000);
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
