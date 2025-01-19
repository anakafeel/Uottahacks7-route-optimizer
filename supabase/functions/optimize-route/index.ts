import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { route, trafficData } = await req.json();
    
    // Prepare context for Groq
    const prompt = `Given the following route and traffic data, provide optimization recommendations:
    Route: ${JSON.stringify(route)}
    Traffic Data: ${JSON.stringify(trafficData)}
    
    Provide specific recommendations for:
    1. Alternative routes
    2. Expected delays
    3. Weather impact
    Format as JSON.`;

    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama2-70b-4096",
        messages: [
          { role: "system", content: "You are a route optimization AI assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();
    console.log('Groq API Response:', data);

    // Extract recommendations from Groq's response
    const recommendations = data.choices[0].message.content;

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in optimize-route function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});