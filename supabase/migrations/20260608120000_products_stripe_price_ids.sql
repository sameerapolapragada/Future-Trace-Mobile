-- Stripe test-mode price IDs for V1 SKUs (Career X-Ray $1.99, AI Career Radar $9.99/mo)
-- Created in Stripe account acct_1TcvvOJIoQ342yCe (test mode).
-- Re-run with live price IDs before production checkout.

begin;

update public.products
set stripe_price_id = 'price_1TfxtpBxBGNjOmXM5gLLn0QZ'
where id = 'xray';

update public.products
set stripe_price_id = 'price_1TfxtqBxBGNjOmXMEfkT28sa'
where id = 'radar';

commit;
