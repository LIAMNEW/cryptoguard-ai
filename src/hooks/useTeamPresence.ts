import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  userId: string;
  username: string;
  onlineAt: string;
  color: string;
}

const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

export const useTeamPresence = (username: string = 'Anonymous') => {
  const [onlineMembers, setOnlineMembers] = useState<TeamMember[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    const userId = Math.random().toString(36).substring(7);
    const userColor = colors[Math.floor(Math.random() * colors.length)];

    console.log('👥 Setting up team presence for:', username);

    const presenceChannel = supabase.channel('team-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        console.log('👥 Presence sync:', state);
        
        const members: TeamMember[] = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0];
            if (presence.userId && presence.username) {
              members.push(presence as TeamMember);
            }
          }
        });
        
        setOnlineMembers(members);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('👋 User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('👋 User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId,
            username,
            onlineAt: new Date().toISOString(),
            color: userColor,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      console.log('👥 Cleaning up presence channel');
      presenceChannel.unsubscribe();
    };
  }, [username]);

  return { onlineMembers, channel };
};
