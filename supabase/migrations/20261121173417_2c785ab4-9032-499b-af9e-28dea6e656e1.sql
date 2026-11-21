CREATE POLICY "premium subscribers can view published premium videos" ON public.videos FOR SELECT TO authenticated USING (
  is_published
  AND access_level = 'premium'
  AND EXISTS (
    SELECT 1
    FROM public.premium_subscriptions AS subscription
    WHERE subscription.user_id = auth.uid()
      AND subscription.status = 'active'
      AND subscription.starts_at <= now()
      AND subscription.ends_at >= now()
  )
);