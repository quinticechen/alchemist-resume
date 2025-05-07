
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.12'
import { Client } from "https://deno.land/x/notion_sdk@v2.2.3/src/mod.ts";
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = 'https://vhofgqmmovjtcnakowlv.supabase.co'
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

interface NotionBlock {
  type: string;
  text: string;
  content?: Array<NotionBlock>;
  url?: string;
  annotations?: any;
  is_list_item?: boolean;
  list_type?: 'bulleted_list' | 'numbered_list';
  media_type?: string;
  media_url?: string;
}

// Function to extract text from rich_text array with annotations
function extractRichText(richTextArray: any[]): { text: string, annotations: any[], links: any[] } {
  let combinedText = '';
  const annotations = [];
  const links = [];
  
  if (!richTextArray || richTextArray.length === 0) return { text: '', annotations: [], links: [] };
  
  for (const textObject of richTextArray) {
    combinedText += textObject.plain_text || '';
    
    // Capture annotations
    if (textObject.annotations) {
      if (textObject.annotations.bold || 
          textObject.annotations.italic || 
          textObject.annotations.strikethrough || 
          textObject.annotations.underline ||
          textObject.annotations.code) {
        annotations.push({
          text: textObject.plain_text,
          ...textObject.annotations,
          start: combinedText.length - textObject.plain_text.length,
          end: combinedText.length
        });
      }
    }
    
    // Capture links
    if (textObject.href) {
      links.push({
        text: textObject.plain_text,
        url: textObject.href,
        start: combinedText.length - textObject.plain_text.length,
        end: combinedText.length
      });
    }
  }
  
  return { text: combinedText, annotations, links };
}

async function getNotionPageContent(notionClient: Client, pageId: string): Promise<NotionBlock[]> {
  try {
    const blocks = await notionClient.blocks.children.list({
      block_id: pageId,
    });

    const processedBlocks: NotionBlock[] = [];
    let currentListType = null;
    let currentListItems: NotionBlock[] = [];

    for (const block of blocks.results) {
      // @ts-ignore - Notion SDK types are not complete
      const blockType = block.type;
      let result: NotionBlock | null = null;

      // Handle different block types
      switch (blockType) {
        case 'paragraph': {
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.paragraph?.rich_text || []);
          result = { 
            type: 'paragraph', 
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined
          };
          break;
        }
        
        case 'heading_1': {
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.heading_1?.rich_text || []);
          result = { 
            type: 'heading_1', 
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined
          };
          break;
        }
        
        case 'heading_2': {
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.heading_2?.rich_text || []);
          result = { 
            type: 'heading_2', 
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined
          };
          break;
        }
        
        case 'heading_3': {
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.heading_3?.rich_text || []);
          result = { 
            type: 'heading_3', 
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined
          };
          break;
        }
        
        case 'bulleted_list_item': {
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.bulleted_list_item?.rich_text || []);
          result = { 
            type: 'list_item', 
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined,
            is_list_item: true,
            list_type: 'bulleted_list'
          };
          break;
        }
        
        case 'numbered_list_item': {
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.numbered_list_item?.rich_text || []);
          result = { 
            type: 'list_item', 
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined,
            is_list_item: true,
            list_type: 'numbered_list'
          };
          break;
        }
        
        case 'image': {
          // @ts-ignore
          const imageUrl = block.image?.file?.url || block.image?.external?.url;
          // @ts-ignore
          const caption = block.image?.caption?.length > 0 ? extractRichText(block.image?.caption).text : '';
          
          if (imageUrl) {
            result = { 
              type: 'media', 
              text: caption,
              media_type: 'image',
              media_url: imageUrl
            };
          }
          break;
        }
        
        case 'video': {
          // @ts-ignore
          const videoUrl = block.video?.file?.url || block.video?.external?.url;
          // @ts-ignore
          const caption = block.video?.caption?.length > 0 ? extractRichText(block.video?.caption).text : '';
          
          if (videoUrl) {
            result = { 
              type: 'media', 
              text: caption,
              media_type: 'video',
              media_url: videoUrl
            };
          }
          break;
        }
        
        default:
          // Handle other block types if needed
          console.log(`Unhandled block type: ${blockType}`);
          break;
      }

      if (result) {
        processedBlocks.push(result);
      }
    }

    return processedBlocks.filter(block => block.text !== '' || block.media_url);
  } catch (error) {
    console.error(`Error fetching page content for ${pageId}:`, error);
    return [];
  }
}

// Handler for HTTP requests
Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] 🚀 Notion Sync function triggered`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request')
    return new Response(null, { 
      headers: corsHeaders 
    });
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
    }

    // Check if this is a status check request
    if (requestBody && requestBody.action === 'check-status') {
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
      return new Response(
        JSON.stringify({ 
          error: 'Notion API key or database ID not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const notion = new Client({ 
      auth: notionApiKey,
    });

    console.log(`Fetching data from Notion database: ${databaseId.substring(0, 8)}...`)

    // Query the Notion database
    let allPages = [];
    let hasMore = true;
    let nextCursor = undefined;
    
    while (hasMore) {
      const queryBody: any = {
        page_size: 100
      };
      
      if (nextCursor) {
        queryBody.start_cursor = nextCursor;
      }
      
      try {
        const response = await notion.databases.query({
          database_id: databaseId,
          ...queryBody
        });
        
        const pages = response.results;
        console.log(`Retrieved ${pages.length} pages from Notion`)
        
        // Process each page
        for (const page of pages) {
          try {
            // Extract basic page information
            const pageContent = await getNotionPageContent(notion, page.id);
            const platformData = {
              id: page.id,
              title: page.properties.Platform?.title?.[0]?.plain_text || 'Untitled',
              url: page.properties.URL?.url || '',
              description: page.properties.Description?.rich_text?.[0]?.plain_text || '',
              content: pageContent,
              notion_url: page.url || '',
              created_time: page.created_time,
              last_edited_time: page.last_edited_time,
            };

            // Upsert to platform table
            const { error: upsertError } = await supabase
              .from('platform')
              .upsert(platformData, { 
                onConflict: 'id'
              });

            if (upsertError) {
              console.error(`Error syncing page ${platformData.title} to Supabase:`, upsertError);
              throw upsertError;
            }
            
            console.log(`Successfully synced page ${platformData.title} to Supabase`);
            allPages.push({ id: page.id, title: platformData.title, status: 'success' });
          } catch (pageError) {
            console.error(`Error processing Notion page:`, pageError);
            allPages.push({ 
              id: page.id, 
              status: 'error', 
              error: pageError.message 
            });
          }
        }
        
        hasMore = response.has_more;
        nextCursor = response.next_cursor;
        
      } catch (error) {
        console.error(`Error fetching from Notion API:`, error);
        return new Response(
          JSON.stringify({ 
            error: `Error fetching from Notion API: ${error.message}`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    const successCount = allPages.filter(p => p.status === 'success').length;
    const errorCount = allPages.filter(p => p.status === 'error').length;
    
    console.log(`Sync complete. Success: ${successCount}, Failed: ${errorCount}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${successCount} pages successfully. Failed: ${errorCount}`,
        results: allPages
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`Error in Notion sync:`, error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
