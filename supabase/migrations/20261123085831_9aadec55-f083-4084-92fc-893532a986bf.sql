DROP POLICY "free videos public" ON public.videos;
DROP POLICY "premium subscribers can view published premium videos" ON public.videos;
DROP POLICY "videos admin manage" ON public.videos;

CREATE POLICY "videos published free or subscribed premium read" ON public.videos
FOR SELECT TO public
USING (
  (is_published AND (
    access_level = 'free'
    OR (
      access_level = 'premium'
      AND EXISTS (
        SELECT 1
        FROM public.premium_subscriptions AS subscription
        WHERE subscription.user_id = auth.uid()
          AND subscription.status = 'active'
          AND subscription.starts_at <= now()
          AND subscription.ends_at >= now()
      )
    )
  ))
  OR public.is_admin()
);

CREATE POLICY "videos admin insert" ON public.videos
FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "videos admin update" ON public.videos
FOR UPDATE TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "videos admin delete" ON public.videos
FOR DELETE TO authenticated
USING (public.is_admin());