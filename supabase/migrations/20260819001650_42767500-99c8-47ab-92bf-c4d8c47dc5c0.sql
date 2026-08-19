create table if not exists public.topic_questions (
  id uuid primary key default gen_random_uuid(),
  subject_key text not null,
  paper_key text not null,
  paper_label text not null,
  topic text not null,
  sort_order integer not null default 0,
  questions_url text,
  ms_url text,
  video_url text,
  access_level access_level not null default 'free',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_key, paper_key, topic)
);

grant select on public.topic_questions to anon;
grant select, insert, update, delete on public.topic_questions to authenticated;
grant all on public.topic_questions to service_role;

alter table public.topic_questions enable row level security;

drop policy if exists "Anyone can view published topic questions" on public.topic_questions;
create policy "Anyone can view published topic questions" on public.topic_questions
  for select using (is_published or public.is_admin());

drop policy if exists "Admins manage topic questions" on public.topic_questions;
create policy "Admins manage topic questions" on public.topic_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists topic_questions_updated_at on public.topic_questions;
create trigger topic_questions_updated_at before update on public.topic_questions
  for each row execute function public.set_updated_at();

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'math-9709','S1','Probability & Statistics 1 (S1)', t, ord
from unnest(array[
 'Cumulative Frequency','Histograms','Boxplots, Stem & Leaf','Coding, Mean and Standard Deviation',
 'Probability 1','Probability 2','Permutations & Combinations (Words)','Permutations & Combinations (Groups)',
 'Discrete Random Variables 1','Discrete Random Variables 2','Binomial Distribution','Geometric Distribution',
 'Binomial and Geometric Distributions','Probability with Perms & Combs','Normal Distribution 1',
 'Normal Distribution 2','Approximating Binomial using Normal Distribution']) with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'math-9709','P1','Pure Mathematics 1 (P1)', t, ord
from unnest(array[
 'Quadratics and the Discriminant 1','Quadratics and the Discriminant 2','Functions, Domain and Range 1',
 'Functions, Domain and Range 2','Transformations of Graphs','Transformations of Trig Graphs',
 'Circle Geometry 1','Circle Geometry 2','Coordinate Geometry and the Discriminant 1',
 'Coordinate Geometry and the Discriminant 2','Radians 1','Radians 2','Trig Equations and Identities 1',
 'Trig Equations and Identities 2','Mixed Arithmetic and Geometric Series 1','Mixed Arithmetic and Geometric Series 2',
 'Binomial Expansion 1','Binomial Expansion 2','Differentiation: Tangents and Normals 1',
 'Differentiation: Tangents and Normals 2','Differentiation: Stationary Points and Chords 1',
 'Differentiation: Stationary Points 2','Differentiation: Increasing and Decreasing Functions',
 'Differentiation: Connected Rates of Change','Integration: Finding Areas 1','Integration: Finding Areas 2',
 'Integration: Finding Equation of Line 1','Integration: Finding Equation of Line 2','Improper Integrals',
 'Integration: Volume of Revolution','Mixed Calculus']) with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'math-9709','P3','Pure Mathematics 3 (P3)', t, ord
from unnest(array[
 'Division & Factor/Remainder Theorems','Modulus Equations and Inequalities',
 'Exps and Logs - Equations and Inequalities 1','Exps and Logs - Equations and Inequalities 2',
 'Transforming Log Graphs to Linear','Trig - Compound and Double Angles 1','Trig - Compound and Double Angles 2',
 'Rsin(x+a) and Rcos(x+a)','Implicit Differentiation','Parametric Differentiation','Product and Quotient Rule 1',
 'Product and Quotient Rule 2','Integration of Trig Functions','Integration by Parts','Integration by Substitution',
 'Partial Fractions and Integration','Differential Equations 1','Differential Equations 2','Iteration with Calculus',
 'Iteration with Graph Sketching or Radians','Binomial Expansion','Partial Fractions and Binomial Expansion',
 'Vectors 1','Vectors 2','Complex Numbers - Equations and Roots','Complex Numbers - Equations and Loci'])
 with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'fmath-9231','FP1','Further Mathematics (Pure 1)', t, ord
from unnest(array[
 'Roots of polynomial equations 1','Roots of polynomials 2','Rational functions and graphs 1',
 'Rational functions and graphs 2','Summation of series 1','Summation of series 2','Matrices 1','Matrices 2',
 'Polar Coordinates 1','Polar Coordinates 2','Vectors 1','Vectors 2','Proof by induction 1','Proof by induction 2'])
 with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'fmath-9231','FP2','Further Mathematics (Pure 2)', t, ord
from unnest(array[
 'Hyperbolic functions 1','Hyperbolic functions 2','Matrices 1','Matrices 2','Differentiation 1','Differentiation 2',
 'Integration 1','Integration 2','Complex Numbers 1','Complex Numbers 2','Differential equations 1',
 'Differential equations 2']) with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'fmath-9231','FMECH','Further Mechanics', t, ord
from unnest(array[
 'Motions 1','Motions 2','Equilibrium of a rigid body 1 & 2','Circular motion 1 & 2','Hooke''s Law 1 & 2',
 'Linear motion under a variable force 1 & 2','Momentum 1 & 2']) with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

insert into public.topic_questions (subject_key, paper_key, paper_label, topic, sort_order)
select 'fmath-9231','FSTATS','Further Statistics', t, ord
from unnest(array[
 'Continuous random variables 1 & 2','Inference using normal and t-distribution 1 & 2','Chi-Squared tests 1 & 2',
 'Non-Parametric tests 1 & 2','Probability generating functions 1 & 2']) with ordinality as x(t, ord)
on conflict (subject_key, paper_key, topic) do nothing;

update public.topic_questions tq
set questions_url = 'https://drive.google.com/file/d/' || v.q || '/view?usp=drive_link',
    ms_url = 'https://drive.google.com/file/d/' || v.m || '/view?usp=drive_link'
from (values
 ('P1','Quadratics and the Discriminant 1','1N8Web2hL1ThhEKjkxJmVpKvWEBNH6WYj','1C1Qc-igDIivF1CKL36S9hXXW24BiI5uU'),
 ('P1','Quadratics and the Discriminant 2','1iI_8TxUnzDbJ6BbyUc3xkU9nXDEt6dWV','1_bV4IvDym6nz7NQfCLW39NCQIIR4jROi'),
 ('P1','Functions, Domain and Range 1','1n_oEMjbjF0ziILvHNHKSDA5RCeBo42bL','13aw_IPQiu3ZvaSc4PX0nMctAZtv6t7Fj'),
 ('P1','Functions, Domain and Range 2','1eJdKiJsjXTkpHZN5koQ1C7Z_-a6swiWg','12HRLowFmWSVL0uYkWMyTCOq_nFEjgUAo'),
 ('P1','Circle Geometry 1','1RLelI_Ke3D0WFxYzv6PENQmSJhNsHePF','1xG9dq1GYBrxHuEGpxs1_EbSa5k6uW3RK'),
 ('P1','Circle Geometry 2','1NTrxEjX60_FNEnx_l7s6r3ddX_uNQZkU','156KWEOcYb1TbJPHw_zoPjMjwtD88bYwA'),
 ('P1','Coordinate Geometry and the Discriminant 1','18rPmY0Id6boaTfjLvZOhG4NQMBMBu6xn','15r7pZCqEMC9WL5vbFNpoLsFVGUQowSpZ'),
 ('P1','Coordinate Geometry and the Discriminant 2','1rRudocqX2yk_Bo-3bhiGxx6kpteyNPif','1vobSitOIBrshYM2Cw1MnRFtCFIwBtHcZ'),
 ('P1','Trig Equations and Identities 1','1Ex-1gClq_KXCWXdPhHrMv0j9TT9jpDt2','1Rvz16VRT9_mnQgAUEgk4dMpaCw8fH8zf'),
 ('P1','Trig Equations and Identities 2','14GrvYBKz3zMXBt2Tj-vMxW5BfYzVckQd','1uu-njPODrOG9Oob3iFxSnMM6SfNWXfmi'),
 ('P1','Mixed Arithmetic and Geometric Series 1','1V9q4cEaakUnEL5C0FDJbkGKT547EdsNf','1OnNbYlc2QJpji-_cD_0bz-g5lhAtjyer'),
 ('P1','Mixed Arithmetic and Geometric Series 2','1P4PvbRA5x2KYimC09LEHmndVJmRAdQAl','1njAMuLWr7NjttJG25KQoqN7UoX3-9cWQ'),
 ('P1','Differentiation: Tangents and Normals 1','1uhFmxiyFqaZSDQ1zrBKtqes1z2O05j1k','1RR_Z8VR6yC3pir7eCxasEgNWlZdbHo-G'),
 ('P1','Differentiation: Tangents and Normals 2','1A95P_Yv4IC2znU3noFphHw1TRniNfvNY','1eRZZAEg-uPnjtdPJaiNdAtieaVwlWDGw'),
 ('P1','Integration: Finding Areas 1','1KgtVH8KLpLzG80oHLud_98tsvH69qJiM','1NEBY5vLT3SmX9IWap8E4XjQ2_FIW0RvO'),
 ('P1','Integration: Finding Areas 2','1X-Fzv2-_8-T1vjcsVQ8FhMCqAi5UABtj','1x0QVJSrNbrAhmMWf8_H2h6EMUYclsDUl'),
 ('P3','Trig - Compound and Double Angles 1','1XQDUuzijCKORqf078UGlaXKJ2IB4oASl','1bWpXkHDnHa2CvfpehObjZnQdZc1f5xAt'),
 ('P3','Trig - Compound and Double Angles 2','1NmlOirp2PBtrZhiOPd1NCgMiOykF7f6q','1Z58grTkCBGdMV1p9HTNEloNTe85fRwlk')
) as v(pk, tp, q, m)
where tq.subject_key = 'math-9709' and tq.paper_key = v.pk and tq.topic = v.tp;