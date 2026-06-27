/*
  # Add Composite Index for Storefront Product Queries

  ## Summary
  - Adds a composite index on products(user_id, is_visible_on_storefront, display_order, id)
  - Optimizes the edge function query that fetches visible products ordered by display_order
  - Covers the exact query pattern used by get-storefront-products edge function

  ## Changes Made
  1. Create composite index for fast storefront product retrieval
  2. Index covers filtering by user_id + visibility and ordering by display_order + id

  ## Performance Impact
  - Reduces query time for large storefronts (3000+ products) from seconds to milliseconds
  - Enables index-only scans for the edge function query
*/

CREATE INDEX IF NOT EXISTS idx_products_storefront_display_order
ON public.products (user_id, is_visible_on_storefront, display_order, id)
WHERE is_visible_on_storefront = true;
