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

// Function to download image and upload to Supabase Storage
async function backupImageToStorage(imageUrl: string, platformTitle: string, imageType = 'image'): Promise<string | null> {
  if (!imageUrl) return null;
  
  try {
    console.log(`Downloading ${imageType}: ${imageUrl.substring(0, 50)}...`);
    
    // Create sanitized filename from URL
    const fileName = `${Date.now()}_${imageType}_${Math.random().toString(36).substring(2, 10)}`;
    const extension = imageUrl.includes('.') ? 
      imageUrl.split('.').pop()?.split('?')[0].toLowerCase() : 'jpg';
    
    // Create sanitized platform name for folder structure
    const sanitizedPlatformName = platformTitle
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    
    const folderPath = `notion-media/${sanitizedPlatformName}`;
    const filePath = `${folderPath}/${fileName}.${extension}`;
    
    // Fetch the image content
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ensure the bucket exists (create if it doesn't)
    const bucketName = 'notion-media';
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(bucket => bucket.name === bucketName)) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, { 
        public: true,
        fileSizeLimit: 100 * 1024 * 1024 // 100MB limit
      });
      
      if (bucketError) {
        console.error(`Error creating bucket: ${bucketError.message}`);
        return null;
      }
    }
    
    // Upload the image to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBlob, {
        contentType: imageBlob.type,
        upsert: true
      });
      
    if (error) {
      console.error(`Error uploading to storage: ${error.message}`);
      return null;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    console.log(`Successfully backed up ${imageType} to: ${publicUrlData.publicUrl}`);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error backing up ${imageType}:`, error);
    return null;
  }
}

// Process content blocks and backup media
async function processContentWithMediaBackup(blocks: NotionBlock[], platformTitle: string): Promise<NotionBlock[]> {
  const processedBlocks = [...blocks];
  
  for (let i = 0; i < processedBlocks.length; i++) {
    const block = processedBlocks[i];
    
    // Handle media blocks
    if (block.type === 'media' && block.media_url) {
      // Backup image or video thumbnail
      const backupUrl = await backupImageToStorage(
        block.media_url, 
        platformTitle,
        block.media_type
      );
      
      // Replace the URL with the backup if successful
      if (backupUrl) {
        processedBlocks[i] = {
          ...block,
          media_url: backupUrl,
          original_media_url: block.media_url // Store original URL for reference
        };
      }
    }
    
    // Process nested content if it exists
    if (block.content && Array.isArray(block.content)) {
      processedBlocks[i].content = await processContentWithMediaBackup(block.content, platformTitle);
    }
  }
  
  return processedBlocks;
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
          
          // Process YouTube and other video URLs to ensure they're embeddable
          let processedVideoUrl = videoUrl;
          if (videoUrl && videoUrl.includes('youtube.com/watch')) {
            // Convert YouTube watch URLs to embed URLs
            const videoId = new URL(videoUrl).searchParams.get('v');
            if (videoId) {
              processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
            }
          } else if (videoUrl && videoUrl.includes('youtu.be')) {
            // Convert youtu.be short URLs to embed URLs
            const videoId = new URL(videoUrl).pathname.substring(1);
            processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
          } else if (videoUrl && videoUrl.includes('vimeo.com')) {
            // Convert Vimeo URLs to embed URLs
            const vimeoId = new URL(videoUrl).pathname.substring(1);
            processedVideoUrl = `https://player.vimeo.com/video/${vimeoId}`;
          }
          
          if (processedVideoUrl) {
            result = { 
              type: 'media', 
              text: caption,
              media_type: 'video',
              media_url: processedVideoUrl
            };
          }
          break;
        }
        
        case 'divider': {
          // Handle divider blocks
          result = {
            type: 'divider',
            text: '',
          };
          break;
        }
        
        case 'quote': {
          // Handle quote blocks
          // @ts-ignore
          const { text, annotations, links } = extractRichText(block.quote?.rich_text || []);
          result = {
            type: 'quote',
            text: text,
            annotations: annotations.length > 0 ? annotations : undefined,
            url: links.length > 0 ? links[0].url : undefined
          };
          break;
        }

        default:
          // Log unhandled block types for debugging
          console.log(`Unhandled block type: ${blockType}`);
          break;
      }

      if (result) {
        processedBlocks.push(result);
      }
    }

    return processedBlocks.filter(block => block.text !== '' || block.media_url || block.type === 'divider');
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
            
            // Extract logo URL from the "Logo" property (Files & media field)
            let logoUrl = null;
            if (
              page.properties.Logo && 
              page.properties.Logo.files && 
              Array.isArray(page.properties.Logo.files) && 
              page.properties.Logo.files.length > 0
            ) {
              const logoFile = page.properties.Logo.files[0];
              // Notion can store both external files and internal files
              if (logoFile.type === 'external') {
                logoUrl = logoFile.external?.url || null;
              } else if (logoFile.type === 'file') {
                logoUrl = logoFile.file?.url || null;
              }
            }
            
            // If we have a logo URL, back it up too
            let backedUpLogoUrl = logoUrl;
            if (logoUrl) {
              const platformTitle = page.properties.Platform?.title?.[0]?.plain_text || 'Untitled';
              backedUpLogoUrl = await backupImageToStorage(
                logoUrl,
                platformTitle,
                'logo'
              ) || logoUrl;
            }
            
            // Process all media content and replace with backed up versions
            const platformTitle = page.properties.Platform?.title?.[0]?.plain_text || 'Untitled';
            const processedPageContent = await processContentWithMediaBackup(pageContent, platformTitle);
            
            const platformData = {
              id: page.id,
              title: page.properties.Platform?.title?.[0]?.plain_text || 'Untitled',
              url: page.properties.URL?.url || '',
              description: page.properties.Description?.rich_text?.[0]?.plain_text || '',
              content: processedPageContent,
              logo_url: backedUpLogoUrl,
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
