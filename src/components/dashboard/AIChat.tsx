import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, User, Bot, Loader2, Mic, MicOff, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder, encodeAudioForAPI, playAudioData, clearAudioQueue } from "@/utils/voiceChat";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m QuantumGuard AI, your blockchain transaction analysis assistant. I can help you understand patterns, anomalies, and compliance requirements in your transaction data. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startVoiceChat = async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });

      // Connect to WebSocket edge function
      const wsUrl = `wss://zytdnqlnsahydanaeupc.supabase.co/functions/v1/voice-chat`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('Voice chat WebSocket connected');
        setIsVoiceMode(true);
        
        toast({
          title: "Voice mode activated",
          description: "You can now speak to QuantumGuard AI",
        });

        // Wait for session.created event before starting recording
        setTimeout(async () => {
          // Start recording and streaming audio
          recorderRef.current = new AudioRecorder((audioData) => {
            if (ws.readyState === WebSocket.OPEN) {
              const base64Audio = encodeAudioForAPI(audioData);
              ws.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Audio
              }));
            }
          });

          await recorderRef.current.start();
          setIsRecording(true);
        }, 1000);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Voice chat event:', data.type);

          if (data.type === 'response.audio.delta' && data.delta) {
            // Play audio response
            setIsSpeaking(true);
            const binaryString = atob(data.delta);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            if (audioContextRef.current) {
              await playAudioData(audioContextRef.current, bytes);
            }
          } else if (data.type === 'response.audio.done') {
            setIsSpeaking(false);
          } else if (data.type === 'conversation.item.input_audio_transcription.completed') {
            // User's speech transcription
            const transcript = data.transcript;
            if (transcript) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: transcript,
                timestamp: new Date()
              }]);
            }
          } else if (data.type === 'response.audio_transcript.delta') {
            // AI's response transcript (build up)
            currentTranscriptRef.current += data.delta;
          } else if (data.type === 'response.audio_transcript.done') {
            // Complete AI transcript
            if (currentTranscriptRef.current) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: currentTranscriptRef.current,
                timestamp: new Date()
              }]);
              currentTranscriptRef.current = '';
            }
          } else if (data.type === 'error') {
            console.error('Voice chat error:', data);
            toast({
              title: "Voice error",
              description: data.error?.message || "An error occurred",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error processing voice message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection error",
          description: "Failed to connect to voice service",
          variant: "destructive"
        });
        stopVoiceChat();
      };

      ws.onclose = () => {
        console.log('Voice chat WebSocket closed');
        stopVoiceChat();
      };

    } catch (error) {
      console.error('Error starting voice chat:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice features",
        variant: "destructive"
      });
    }
  };

  const stopVoiceChat = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    clearAudioQueue();
    setIsVoiceMode(false);
    setIsRecording(false);
    setIsSpeaking(false);
    currentTranscriptRef.current = '';
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Add placeholder for assistant response
    const assistantId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message,
          conversationHistory
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  accumulatedResponse += content;
                  // Update the assistant message in real-time
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantId 
                      ? { ...msg, content: accumulatedResponse }
                      : msg
                  ));
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('AI Chat error:', error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantId 
          ? { ...msg, content: 'I apologize, but I encountered an error processing your request. Please try again. If the issue persists, check that the OpenAI API key is properly configured.' }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputMessage);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="glass-card p-6 h-[600px] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-quantum-green/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-quantum-green" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">QuantumGuard AI Assistant</h3>
          <p className="text-sm text-muted-foreground">Powered by GPT-4o Mini • Streaming responses</p>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-quantum-green/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-quantum-green" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-quantum-green text-background ml-auto'
                    : 'bg-glass-background border border-glass-border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.content}
                  {message.role === 'assistant' && !message.content && isLoading && (
                    <span className="inline-flex items-center gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>●</span>
                      <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>●</span>
                    </span>
                  )}
                </p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-background/70' : 'text-muted-foreground'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-quantum-green/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-quantum-green" />
              </div>
              <div className="bg-glass-background border border-glass-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-quantum-green" />
                  <p className="text-sm text-muted-foreground">QuantumGuard AI is analyzing...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex gap-2 mt-4">
        {!isVoiceMode ? (
          <form onSubmit={handleSubmit} className="flex gap-2 flex-1">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about transaction patterns, compliance, or anomalies..."
              disabled={isLoading}
              className="flex-1 bg-glass-background border-glass-border focus:border-quantum-green"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="bg-quantum-green hover:bg-quantum-green/90 text-background"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-4 p-4 bg-glass-background border border-glass-border rounded-lg">
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              )}
              {isSpeaking && (
                <Volume2 className="w-5 h-5 text-quantum-green animate-pulse" />
              )}
              <span className="text-sm text-foreground">
                {isRecording && !isSpeaking && "Listening..."}
                {isSpeaking && "AI Speaking..."}
                {!isRecording && !isSpeaking && "Voice mode active"}
              </span>
            </div>
          </div>
        )}
        
        <Button
          type="button"
          onClick={isVoiceMode ? stopVoiceChat : startVoiceChat}
          className={isVoiceMode 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-quantum-green hover:bg-quantum-green/90 text-background"
          }
        >
          {isVoiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        {isVoiceMode 
          ? "Voice mode: Speak naturally or try commands like 'Show me high-risk transactions' or 'Generate a report'"
          : "Type or click the microphone for voice queries. Ask about transaction analysis, patterns, compliance, or anomalies."
        }
      </div>
    </Card>
  );
}