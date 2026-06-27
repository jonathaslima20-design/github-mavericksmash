import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'public, max-age=300',
};

interface GetStorefrontProductsRequest {
  userId: string;
  categoryOffset?: number;
  categoriesPerPage?: number;
  productsPerCategory?: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  discounted_price: number | null;
  is_starting_price: boolean;
  featured_image_url: string | null;
  status: string;
  category: string[];
  display_order: number | null;
  has_tiered_pricing: boolean;
  min_tiered_price: number | null;
  max_tiered_price: number | null;
  short_description: string | null;
  colors: string[] | null;
  sizes: string[] | null;
  flavors: string[] | null;
  has_weight_variants: boolean;
  min_variant_price: number | null;
  max_variant_price: number | null;
  external_checkout_url: string | null;
}

interface CategoryResult {
  name: string;
  products: Product[];
  totalProducts: number;
  hasMore: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body: GetStorefrontProductsRequest = await req.json();
    const { userId, categoryOffset = 0, categoriesPerPage = 3, productsPerCategory = 24 } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );

    // Step 1: Get category display settings for this user
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_storefront_settings')
      .select('settings')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching storefront settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch storefront settings' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const categorySettings = settingsData?.settings?.categoryDisplaySettings || [];

    // Step 2: Get all visible products for this user with minimal fields
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select([
        'id',
        'title',
        'price',
        'discounted_price',
        'is_starting_price',
        'featured_image_url',
        'status',
        'category',
        'display_order',
        'has_tiered_pricing',
        'min_tiered_price',
        'max_tiered_price',
        'short_description',
        'colors',
        'sizes',
        'flavors',
        'has_weight_variants',
        'min_variant_price',
        'max_variant_price',
        'external_checkout_url',
      ].join(','))
      .eq('user_id', userId)
      .eq('is_visible_on_storefront', true)
      .order('display_order', { ascending: true, nullsLast: true })
      .order('id', { ascending: false });

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allProducts = products || [];

    // Step 3: Group products by category
    const groupedByCategory: Record<string, Product[]> = {};
    const othersProducts: Product[] = [];

    for (const product of allProducts) {
      if (product.category && Array.isArray(product.category) && product.category.length > 0) {
        for (const cat of product.category) {
          const sanitized = cat.trim();
          if (sanitized) {
            if (!groupedByCategory[sanitized]) {
              groupedByCategory[sanitized] = [];
            }
            // Avoid duplicates if product is in multiple categories
            if (!groupedByCategory[sanitized].find(p => p.id === product.id)) {
              groupedByCategory[sanitized].push(product);
            }
          }
        }
      } else {
        othersProducts.push(product);
      }
    }

    // Step 4: Determine category order
    const enabledSettings = categorySettings
      .filter((s: any) => s.enabled !== false)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    const orderedCategoryNames: string[] = [];
    const configuredCategories = new Set(categorySettings.map((s: any) => s.category));

    // Add categories in configured order
    for (const setting of enabledSettings) {
      if (groupedByCategory[setting.category]) {
        orderedCategoryNames.push(setting.category);
      }
    }

    // Add unconfigured categories (alphabetically)
    const unconfiguredCategories = Object.keys(groupedByCategory)
      .filter(cat => !configuredCategories.has(cat))
      .sort((a, b) => a.localeCompare(b));

    for (const cat of unconfiguredCategories) {
      orderedCategoryNames.push(cat);
    }

    // Add "Outros" if there are products without category
    if (othersProducts.length > 0) {
      orderedCategoryNames.push('Outros');
      groupedByCategory['Outros'] = othersProducts;
    }

    // Step 5: Paginate categories
    const totalCategories = orderedCategoryNames.length;
    const paginatedCategoryNames = orderedCategoryNames.slice(
      categoryOffset,
      categoryOffset + categoriesPerPage
    );

    const hasMoreCategories = categoryOffset + categoriesPerPage < totalCategories;

    // Step 6: Build response with paginated products per category
    const categories: CategoryResult[] = [];

    for (const categoryName of paginatedCategoryNames) {
      const categoryProducts = groupedByCategory[categoryName] || [];
      const paginatedProducts = categoryProducts.slice(0, productsPerCategory);
      const hasMoreProducts = categoryProducts.length > productsPerCategory;

      categories.push({
        name: categoryName,
        products: paginatedProducts,
        totalProducts: categoryProducts.length,
        hasMore: hasMoreProducts,
      });
    }

    return new Response(
      JSON.stringify({
        categories,
        totalCategories,
        hasMoreCategories,
        nextCategoryOffset: hasMoreCategories ? categoryOffset + categoriesPerPage : null,
        totalProducts: allProducts.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Storefront products error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
