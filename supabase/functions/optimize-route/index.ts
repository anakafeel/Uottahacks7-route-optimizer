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
    
    if (!route) {
      throw new Error('Route data is required');
    }

    console.log('Processing route optimization request:', { route, trafficData });
    
    // Prepare context for Groq
    const prompt = `Given the following route and traffic data, provide optimization recommendations:
    Route: ${JSON.stringify(route)}
    Traffic Data: ${JSON.stringify(trafficData || [])}
    
    Analyze the route and provide specific recommendations for:
    1. Alternative routes to avoid congestion
    2. Expected delays based on current conditions
    3. Weather impact on the route
    
    Format the response as a JSON object with the following structure:
    {
      "alternatives": [{"description": "string", "estimated_time": "number"}],
      "delays": {"severity": "string", "minutes": "number"},
      "weather_impact": "string"
    }`;

    console.log('Sending request to Groq API with prompt:', prompt);

    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama2-70b-4096",
        messages: [
          { 
            role: "system", 
            content: "You are a route optimization AI assistant. Always respond with valid JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Groq API Response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Groq API');
    }

    // Parse the AI response as JSON
    let recommendations;
    try {
      recommendations = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse Groq response as JSON:', e);
      recommendations = {
        alternatives: [],
        delays: { severity: "unknown", minutes: 0 },
        weather_impact: "No weather data available"
      };
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in optimize-route function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process route optimization request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});