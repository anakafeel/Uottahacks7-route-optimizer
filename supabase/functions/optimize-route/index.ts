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
  estimated_duration: number;
  distance: string;
  traffic_level: string;
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { route, trafficData } = await req.json()
    console.log('Received route data:', route)
    console.log('Received traffic data:', trafficData)

    // Prepare the prompt with route and traffic information
    const prompt = `Analyze this route and traffic data and provide optimization recommendations:
      Route: From ${route.start_lat},${route.start_lng} to ${route.end_lat},${route.end_lng}
      Current traffic level: ${route.traffic_level}
      Estimated duration: ${route.estimated_duration} minutes
      Distance: ${route.distance} km
      Traffic conditions: ${JSON.stringify(trafficData)}
      
      Provide recommendations in this format:
      1. Alternative routes with estimated times
      2. Expected delays and their severity
      3. Weather impact if any
      4. Safety considerations`

    console.log('Sending prompt to Groq:', prompt)

    const groqApiKey = Deno.env.get('GROQ_API_KEY')
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured')
    }

    // Make request to Groq API with timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
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
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!groqResponse.ok) {
        const errorText = await groqResponse.text()
        console.error('Groq API error response:', errorText)
        throw new Error('Failed to get response from Groq API')
      }

      const groqData = await groqResponse.json()
      console.log('Groq API response:', groqData)

      const aiResponse = groqData.choices[0]?.message?.content || ''
      
      // Structure the recommendations based on AI response
      const recommendations = {
        alternatives: [
          {
            description: aiResponse.includes('Alternative') ? 
              aiResponse.split('Alternative')[1]?.split('\n')[0] : 
              "Consider taking an alternative route based on current conditions.",
            estimated_time: route.estimated_duration
          }
        ],
        delays: {
          minutes: Math.round(route.estimated_duration * 0.2), // 20% buffer
          severity: trafficData?.some((t: TrafficUpdate) => t.severity === 'high') ? 'high' : 'moderate'
        },
        weather_impact: aiResponse.includes('Weather') ? 
          aiResponse.split('Weather')[1]?.split('\n')[0] : 
          "No significant weather impact reported",
      }

      return new Response(
        JSON.stringify({ recommendations }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (fetchError) {
      console.error('Fetch error:', fetchError)
      if (fetchError.name === 'AbortError') {
        throw new Error('Groq API request timed out')
      }
      throw fetchError
    } finally {
      clearTimeout(timeout)
    }
  } catch (error) {
    console.error('Error in optimize-route function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        recommendations: {
          alternatives: [
            {
              description: "Default route recommendation",
              estimated_time: 25
            }
          ],
          delays: {
            minutes: 5,
            severity: "unknown"
          },
          weather_impact: "Weather data unavailable",
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})