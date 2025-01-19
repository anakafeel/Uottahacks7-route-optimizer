import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userMessage } = await req.json();
    console.log('Received user message:', userMessage);

    const prompt = `You are a chatbot that gives actionable advice on commuting methods and route recommendations. Respond naturally based on the following user query: "${userMessage}".` +
                   `\nProvide answers like:\n1. If traffic data applies, suggest better alternatives.\n2. If weather impacts commute, mention it.\n`;

    console.log('Prompt for GROQ AI:', prompt);

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    // Abort in 30 seconds if no response
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mixtral-8x7b-32768',
          messages: [
            { role: 'system', content: 'You are an AI assistant that provides route and commuting suggestions.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!apiResponse.ok) {
        console.error('Groq API error:', await apiResponse.text());
        throw new Error('Failed to retrieve response from Groq');
      }

      const result = await apiResponse.json();
      const reply = result.choices[0]?.message?.content || 'I am sorry, I could not process your request.';

      return new Response(
        JSON.stringify({ reply }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (err) {
      console.error('Fetch error:', err.message);
      return new Response(
        JSON.stringify({ error: err.message, reply: 'I encountered an issue processing your request.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (err) {
    console.error('Error in chatbot endpoint:', err.message);
    return new Response(
      JSON.stringify({ error: 'Internal server error', reply: 'Sorry, something went wrong.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
