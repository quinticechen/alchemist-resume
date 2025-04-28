
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
  console.log(`[${new Date().toISOString()}] 🚀 Notion Sync function triggered`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const notionApiKey = Deno.env.get('NOTION_API_KEY') || ''
    const databaseId = Deno.env.get('NOTION_DATABASE_ID') || ''
    
    console.log(`API Key exists: ${!!notionApiKey}, Database ID exists: ${!!databaseId}, Database ID: ${databaseId ? databaseId.substring(0, 8) + '...' : 'missing'}`)

    // Parse request body if it exists
    let requestBody = {};
    try {
      if (req.bodyUsed === false && req.body) {
        const bodyText = await req.text();
        if (bodyText) {
          console.log(`Request body received: ${bodyText.substring(0, 100)}${bodyText.length > 100 ? '...' : ''}`)
          requestBody = JSON.parse(bodyText);
        }
      }
    } catch (e) {
      console.log(`Error parsing request body: ${e.message}`);
      // Continue even if body parsing fails
    }

    // Check if this is a status check request
    if (requestBody && requestBody.action === 'check-status') {
      console.log('Status check request received')
      return new Response(
        JSON.stringify({
          hasNotionApiKey: !!notionApiKey,
          hasNotionDatabaseId: !!databaseId,
          message: notionApiKey && databaseId ? 
            "Configuration complete" : 
            "Missing required configuration"
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    console.log(`Fetching data from Notion database: ${databaseId.substring(0, 8)}...`)

    // Query the Notion database with detailed pagination handling
    let allPages: NotionPage[] = [];
    let hasMore = true;
    let nextCursor = undefined;
    
    while (hasMore) {
      const queryBody: any = {
        page_size: 100 // Maximum allowed by Notion API
      };
      
      if (nextCursor) {
        queryBody.start_cursor = nextCursor;
      }
      
      console.log(`Querying Notion database with cursor: ${nextCursor || 'initial request'}`)
      
      try {
        console.log(`Calling Notion API at: https://api.notion.com/v1/databases/${databaseId}/query`)
        
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(queryBody)
        });
        
        console.log(`Notion API response status: ${response.status}`)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Notion API error: ${response.status}, ${errorText}`)
          
          // Add more detailed error logging
          console.error(`Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`)
          
          return new Response(
            JSON.stringify({ 
              error: `Notion API error: ${response.status}`, 
              details: errorText 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          )
        }

        const data = await response.json();
        console.log(`Notion API response data structure: ${JSON.stringify(Object.keys(data))}`)
        
        if (!data.results) {
          console.error(`Unexpected API response format: ${JSON.stringify(data).substring(0, 200)}...`)
          return new Response(
            JSON.stringify({ 
              error: 'Unexpected API response format', 
              details: data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        console.log(`Retrieved ${data.results.length} pages from Notion`)
        
        // Log sample of first page properties to help debug
        if (data.results.length > 0) {
          const firstPage = data.results[0];
          console.log(`Sample page ID: ${firstPage.id}`)
          console.log(`Sample page properties: ${JSON.stringify(Object.keys(firstPage.properties))}`)
          console.log(`Property details: ${JSON.stringify(firstPage.properties)}`)
        }
        
        allPages = allPages.concat(data.results as NotionPage[]);
        
        hasMore = data.has_more;
        nextCursor = data.next_cursor;
      } catch (fetchError) {
        console.error(`Error fetching from Notion API: ${fetchError.message}`)
        console.error(fetchError.stack)
        
        return new Response(
          JSON.stringify({ 
            error: `Error fetching from Notion API: ${fetchError.message}`, 
            stack: fetchError.stack 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    const pages = allPages;
    
    console.log(`Found ${pages.length} pages in Notion database`)

    // First, let's clear all the existing platforms to avoid duplicates
    console.log('Clearing existing platform table data')
    const { error: deleteError } = await supabase
      .from('platform')
      .delete()
      .not('id', 'is', null); // Safety check to avoid deleting everything if there's an issue
      
    if (deleteError) {
      console.error(`Error clearing platform table: ${JSON.stringify(deleteError)}`)
      // Continue with the process even if clearing fails
    } else {
      console.log('Successfully cleared platform table');
    }
    
    // Process each page from Notion and sync to Supabase
    console.log(`Processing ${pages.length} Notion pages for synchronization`)
    const syncResults = await Promise.all(pages.map(async (page, index) => {
      try {
        console.log(`Processing page ${index + 1}/${pages.length}: ${page.id}`);
        console.log(`Page properties: ${JSON.stringify(Object.keys(page.properties))}`);
        
        // More robust title extraction - first check for fields named Platform, Name, or Title
        let title = '';
        if (page.properties.Platform?.title?.length > 0) {
          title = page.properties.Platform.title[0]?.plain_text || '';
          console.log(`Found title in "Platform" property: ${title}`);
        } else if (page.properties.Name?.title?.length > 0) {
          title = page.properties.Name.title[0]?.plain_text || '';
          console.log(`Found title in "Name" property: ${title}`);
        } else if (page.properties.Title?.title?.length > 0) {
          title = page.properties.Title.title[0]?.plain_text || '';
          console.log(`Found title in "Title" property: ${title}`);
        } else {
          // Try to find any property with type title
          for (const [key, value] of Object.entries(page.properties)) {
            if (value.type === 'title' && value.title?.length > 0) {
              title = value.title[0]?.plain_text || '';
              console.log(`Found title in "${key}" property: ${title}`);
              break;
            }
          }
        }
        
        if (!title) {
          title = 'Untitled';
          console.log(`No title found, using default: ${title}`);
        }
        
        // More comprehensive URL extraction
        let url = '';
        if (page.properties.URL?.url) {
          url = page.properties.URL.url || '';
          console.log(`Found URL in "URL" property: ${url}`);
        } else if (page.properties.Link?.url) {
          url = page.properties.Link.url || '';
          console.log(`Found URL in "Link" property: ${url}`);
        } else if (page.properties.Website?.url) {
          url = page.properties.Website.url || '';
          console.log(`Found URL in "Website" property: ${url}`);
        } else {
          // Try to find any property with type url
          for (const [key, value] of Object.entries(page.properties)) {
            if (value.type === 'url' && value.url) {
              url = value.url || '';
              console.log(`Found URL in "${key}" property: ${url}`);
              break;
            }
          }
        }
        
        if (!url) {
          url = page.url || '';
          console.log(`No URL property found, using page URL: ${url}`);
        }
        
        // More robust description extraction
        let description = '';
        if (page.properties.Description?.rich_text?.length > 0) {
          description = page.properties.Description.rich_text[0]?.plain_text || '';
          console.log(`Found description in "Description" property: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`);
        } else if (page.properties.Notes?.rich_text?.length > 0) {
          description = page.properties.Notes.rich_text[0]?.plain_text || '';
          console.log(`Found description in "Notes" property: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`);
        } else {
          // Try to find any property with type rich_text
          for (const [key, value] of Object.entries(page.properties)) {
            if (value.type === 'rich_text' && value.rich_text?.length > 0) {
              description = value.rich_text[0]?.plain_text || '';
              console.log(`Found description in "${key}" property: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`);
              break;
            }
          }
        }

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
                .filter(([key, value]) => value && value.type !== 'title' && key !== 'URL' && key !== 'Description')
                .map(([key, value]) => {
                  const propertyKey = key.toLowerCase().replace(/\s+/g, '_');
                  let propertyValue = '';
                  
                  // Extract value based on property type
                  if (value.type === 'rich_text' && value.rich_text?.[0]) {
                    propertyValue = value.rich_text[0].plain_text;
                  } else if (value.type === 'url') {
                    propertyValue = value.url;
                  } else if (value.type === 'select' && value.select?.name) {
                    propertyValue = value.select.name;
                  } else if (value.type === 'multi_select' && value.multi_select?.length > 0) {
                    propertyValue = value.multi_select.map(item => item.name).join(', ');
                  } else if (value.type === 'checkbox') {
                    propertyValue = value.checkbox ? 'Yes' : 'No';
                  } else if (value.type === 'date' && value.date) {
                    propertyValue = value.date.start;
                  } else if (value.type === 'number' && value.number !== undefined) {
                    propertyValue = String(value.number);
                  } else if (value.type === 'email') {
                    propertyValue = value.email;
                  } else if (value.type === 'phone_number') {
                    propertyValue = value.phone_number;
                  }
                  
                  return [propertyKey, propertyValue];
                })
            )
          }
        };

        console.log(`Inserting platform data for ${title}`);
        console.log(`Platform data: ${JSON.stringify({
          id: platformData.id,
          url: platformData.url,
          title: platformData.attrs.title,
          description: platformData.attrs.description ? platformData.attrs.description.substring(0, 30) + '...' : 'none'
        })}`);

        // Upsert to platform table in Supabase
        const { data: upsertedData, error } = await supabase
          .from('platform')
          .upsert(platformData, { 
            onConflict: 'id', 
            returning: 'minimal' 
          });

        if (error) {
          console.error(`Error syncing page ${title} to Supabase: ${JSON.stringify(error)}`);
          return { 
            id: page.id, 
            title, 
            status: 'error', 
            error: error.message 
          };
        }
        
        console.log(`Successfully synced page ${title} to Supabase`);
        return { 
          id: page.id, 
          title, 
          status: 'success' 
        };
      } catch (err) {
        console.error(`Error processing Notion page: ${err.message}`);
        console.error(err.stack);
        return { 
          id: page.id || 'unknown', 
          status: 'error', 
          error: err.message 
        };
      }
    }));
    
    const successCount = syncResults.filter(r => r.status === 'success').length;
    const errorCount = syncResults.filter(r => r.status === 'error').length;
    
    console.log(`Sync complete. Success: ${successCount}, Failed: ${errorCount}`);
    
    // Return the sync results with more detailed information
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${successCount} pages successfully. Failed: ${errorCount}`, 
        results: syncResults 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error in Notion sync: ${error.message}`);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
