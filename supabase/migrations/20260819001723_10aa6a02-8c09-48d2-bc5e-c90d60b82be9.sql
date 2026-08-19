update public.tutor_profiles
set is_approved = true,
    is_visible = true,
    highest_qualification = coalesce(nullif(highest_qualification,''), 'MSc'),
    qualifications = case when coalesce(array_length(qualifications,1),0) = 0
      then array['MSc Mathematics','BSc (Ed) Mathematics'] else qualifications end,
    pricing = case when pricing = '{}'::jsonb then '{"hourly":{"NGN":15000,"GBP":25}}'::jsonb else pricing end,
    rating = greatest(rating, 4.5),
    review_count = greatest(review_count, 12)
where display_name = 'Ahmed zaoban';

insert into public.tutor_profiles (
  user_id, display_name, photo_url, bio, subjects, topics, qualifications,
  years_experience, pricing, rating, review_count, is_approved, is_visible,
  exam_track, highest_qualification
) values (
  gen_random_uuid(),
  'Aisha Bello',
  null,
  'Cambridge A Level and IGCSE Mathematics specialist with a decade of classroom and one-to-one experience. Aisha focuses on exam technique, clear worked reasoning and building confidence in Pure, Statistics and Mechanics.',
  array['Mathematics','Further Mathematics'],
  array['Pure Mathematics 1 (P1)','Pure Mathematics 3 (P3)','Probability & Statistics 1 (S1)','Mechanics'],
  array['MSc Applied Mathematics','BSc Mathematics (First Class)'],
  10,
  '{"hourly":{"NGN":18000,"GBP":30}}'::jsonb,
  4.9, 27, true, true, 'CT', 'MSc'
)
on conflict (user_id) do nothing;

insert into public.tutor_availability (tutor_id, day_of_week, start_time, end_time, timezone, is_active)
select tp.id, d.dow, '16:00'::time, '19:00'::time, 'Africa/Lagos', true
from public.tutor_profiles tp, (values (1),(3),(6)) as d(dow)
where tp.display_name = 'Aisha Bello'
  and not exists (
    select 1 from public.tutor_availability a where a.tutor_id = tp.id and a.day_of_week = d.dow
  );