import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response("OPENAI_API_KEY not configured", { status: 500 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let openAISocket: WebSocket | null = null;

    socket.onopen = async () => {
      console.log("Client WebSocket opened");
      
      // Connect to OpenAI Realtime API
      openAISocket = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01",
        {
          headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1"
          }
        }
      );

      openAISocket.onopen = () => {
        console.log("OpenAI WebSocket opened");
        
        // Send session configuration after connection
        openAISocket?.send(JSON.stringify({
          type: "session.update",
          session: {
            modalities: ["text", "audio"],
            instructions: "You are QuantumGuard AI, a blockchain transaction analysis assistant. Help users understand transaction patterns, anomalies, compliance requirements, and security risks. When users ask to 'show high-risk transactions' or similar commands, acknowledge their request and tell them you've updated the view. Keep responses concise and professional.",
            voice: "alloy",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            temperature: 0.8,
            max_response_output_tokens: "inf"
          }
        }));
      };

      openAISocket.onmessage = (event) => {
        // Forward OpenAI messages to client
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(event.data);
        }
      };

      openAISocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
      };

      openAISocket.onclose = () => {
        console.log("OpenAI WebSocket closed");
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    };

    socket.onmessage = (event) => {
      // Forward client messages to OpenAI
      if (openAISocket?.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      }
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Client WebSocket closed");
      if (openAISocket?.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error("WebSocket setup error:", error);
    return new Response(`WebSocket error: ${error.message}`, { status: 500 });
  }
});
