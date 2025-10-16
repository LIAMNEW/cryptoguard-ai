import { useState, useEffect } from "react";
import { Search, Upload, BarChart3, Activity, Settings, ScrollText, User, FileText } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CommandSearchProps {
  onNavigate: (section: string) => void;
}

const sections = [
  { id: "upload", label: "Upload Data", icon: Upload, keywords: ["upload", "file", "data", "import"] },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, keywords: ["dashboard", "overview", "analytics", "stats"] },
  { id: "blockchain", label: "Live Blockchain Analysis", icon: Activity, keywords: ["blockchain", "live", "ethereum", "bitcoin", "crypto"] },
  { id: "saved", label: "Saved Analyses", icon: Settings, keywords: ["saved", "analyses", "history", "reports"] },
  { id: "audit", label: "Audit Logs", icon: ScrollText, keywords: ["audit", "logs", "activity", "history"] },
  { id: "settings", label: "Settings", icon: User, keywords: ["settings", "profile", "preferences", "account"] },
];

export function CommandSearch({ onNavigate }: CommandSearchProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (sectionId: string) => {
    setOpen(false);
    onNavigate(sectionId);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-3 w-full max-w-2xl px-4 py-2.5 bg-background/50 backdrop-blur border border-border rounded-lg hover:border-quantum-green/50 transition-all group"
      >
        <Search className="w-4 h-4 text-muted-foreground group-hover:text-quantum-green transition-colors" />
        <span className="text-sm text-muted-foreground flex-1 text-left">
          Search QuantumGuard AI...
        </span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted-foreground bg-muted rounded border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for sections, features..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Sections">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <CommandItem
                  key={section.id}
                  value={`${section.label} ${section.keywords.join(" ")}`}
                  onSelect={() => handleSelect(section.id)}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-quantum-green" />
                  <span>{section.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
