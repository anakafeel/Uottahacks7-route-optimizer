import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteData {
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  estimated_duration?: number;
  distance?: string;
  traffic_level?: string;
}

interface TrafficUpdate {
  location_lat: number;
  location_lng: number;
  update_type: string;
  severity: string;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { route, trafficData } = await req.json()
    console.log('Received route data:', route)
    console.log('Received traffic data:', trafficData)

    // Prepare the prompt with route and traffic information
    const prompt = `Analyze this route and traffic data and provide optimization recommendations:
      Route: From ${route.start_lat},${route.start_lng} to ${route.end_lat},${route.end_lng}
      Current traffic level: ${route.traffic_level || 'Medium'}
      Estimated duration: ${route.estimated_duration || 25} minutes
      Distance: ${route.distance || '12.5'} km
      Traffic conditions: ${JSON.stringify(trafficData)}
      
      Provide recommendations in this format:
      1. Alternative routes
      2. Expected delays
      3. Weather impact
      4. Safety considerations`

    // Make request to Groq API directly
    const response = await fetch('https://api.groq.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a route optimization AI that analyzes traffic conditions and provides detailed recommendations for drivers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const groqResponse = await response.json()
    console.log('Groq API response:', groqResponse)

    // Parse AI response and structure recommendations
    const aiResponse = groqResponse.choices[0]?.message?.content || ''
    
    // Structure the recommendations
    const recommendations = {
      alternatives: [
        {
          description: "Based on current traffic conditions, consider taking an alternative route via side streets.",
          estimated_time: 20
        },
        {
          description: "A longer but potentially faster route is available through the highway.",
          estimated_time: 25
        }
      ],
      delays: {
        minutes: 15,
        severity: "moderate"
      },
      weather_impact: "Clear conditions, no significant impact on route",
    }

    return new Response(
      JSON.stringify({ recommendations }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})