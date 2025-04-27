
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12'

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create Supabase client
const supabaseUrl = 'https://vhofgqmmovjtcnakowlv.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Define interface for Notion page objects
interface NotionPage {
  id: string;
  properties: {
    [key: string]: any;
  };
  url: string;
  created_time: string;
  last_edited_time: string;
}

// Handler for HTTP requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const notionApiKey = Deno.env.get('NOTION_API_KEY') || ''
    const databaseId = Deno.env.get('NOTION_DATABASE_ID') || ''

    if (!notionApiKey || !databaseId) {
      console.error('Missing Notion API key or database ID')
      return new Response(
        JSON.stringify({ 
          error: 'Notion API key or database ID not configured', 
          details: {
            hasApiKey: !!notionApiKey,
            hasDatabaseId: !!databaseId
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Fetching data from Notion database:', databaseId)

    // Query the Notion database with more comprehensive error handling
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 100 // Adjust based on your needs
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Notion API error:', errorText)
      return new Response(
        JSON.stringify({ 
          error: `Notion API error: ${response.status}`, 
          details: errorText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    const pages = data.results as NotionPage[]
    
    console.log(`Found ${pages.length} pages in Notion database`)
    
    // Process each page from Notion and sync to Supabase
    const syncResults = await Promise.all(pages.map(async (page) => {
      try {
        // More robust title extraction
        const title = 
          page.properties.Platform?.title?.[0]?.plain_text || 
          page.properties.Name?.title?.[0]?.plain_text || 
          page.properties.URL?.title?.[0]?.plain_text ||
          'Untitled'
        
        // More comprehensive URL extraction
        const url = 
          page.properties.URL?.url || 
          page.properties.Link?.url || 
          page.properties.Website?.url || 
          page.url || 
          ''
        
        // More robust description extraction
        const description = 
          page.properties.Description?.rich_text?.[0]?.plain_text || 
          page.properties.Notes?.rich_text?.[0]?.plain_text || 
          ''

        // Prepare data for Supabase with comprehensive attribute mapping
        const platformData = {
          id: page.id,
          created_time: page.created_time,
          last_edited_time: page.last_edited_time,
          url: url,
          attrs: {
            title: title,
            description: description,
            notionUrl: page.url,
            ...Object.fromEntries(
              Object.entries(page.properties)
                .filter(([_, value]) => value && value.type !== 'title')
                .map(([key, value]) => [
                  key.toLowerCase().replace(/\s+/g, '_'), 
                  value.rich_text?.[0]?.plain_text || 
                  value.url || 
                  value.select?.name || 
                  value.multi_select?.map(item => item.name).join(', ') || 
                  ''
                ])
            )
          }
        }

        // Upsert to Platform table in Supabase
        const { data: upsertedData, error } = await supabase
          .from('Platform')
          .upsert(platformData, { 
            onConflict: 'id', 
            returning: 'minimal' 
          })

        if (error) {
          console.error('Error syncing page to Supabase:', error)
          return { 
            id: page.id, 
            title, 
            status: 'error', 
            error: error.message 
          }
        }
        
        return { 
          id: page.id, 
          title, 
          status: 'success' 
        }
      } catch (err) {
        console.error('Error processing Notion page:', err)
        return { 
          id: page.id, 
          status: 'error', 
          error: err.message 
        }
      }
    }))
    
    // Return the sync results with more detailed information
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${syncResults.filter(r => r.status === 'success').length} pages`, 
        results: syncResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in Notion sync:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

