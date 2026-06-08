-- Stripe test price IDs on the Future-Trace BFF Stripe account (acct used by STRIPE_SECRET_KEY in .env.local)

begin;

update public.products
set stripe_price_id = 'price_1TfxtpBxBGNjOmXM5gLLn0QZ'
where id = 'xray';

update public.products
set stripe_price_id = 'price_1TfxtqBxBGNjOmXMEfkT28sa'
where id = 'radar';

commit;
