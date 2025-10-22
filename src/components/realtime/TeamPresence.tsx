import { useState } from 'react';
import { useTeamPresence } from '@/hooks/useTeamPresence';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Users } from 'lucide-react';

export const TeamPresence = () => {
  const [username, setUsername] = useState('Analyst');
  const { onlineMembers } = useTeamPresence(username);

  return (
    <Card className="p-4 bg-card/50 backdrop-blur border-quantum-green/20">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-quantum-green" />
        <h3 className="text-sm font-semibold text-foreground">Team Online</h3>
        <span className="text-xs text-muted-foreground">
          ({onlineMembers.length})
        </span>
      </div>

      <Input
        type="text"
        placeholder="Your name"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="mb-3 h-8 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {onlineMembers.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-2 bg-background/50 rounded-full px-3 py-1 border border-border"
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: member.color }}
            />
            <span className="text-xs text-foreground">{member.username}</span>
          </div>
        ))}
        {onlineMembers.length === 0 && (
          <p className="text-xs text-muted-foreground">No one else online</p>
        )}
      </div>
    </Card>
  );
};
