# CatchUp Tutors

LOVABLE PROMPT — CATCHUP TUTORS

Build a fully functional, production-ready, deployment-ready Vite + React + TypeScript website for CatchUp Tutors, a premium Cambridge and IGCSE learning platform for Mathematics and Further Mathematics that can be scaled to other subjects.

This is not a generic tutoring site. It is a complete academic ecosystem with:

Programs page

Resource library

Yearly past questions

Topic-based past questions

Free and premium videos

Tutor profiles

Tutor booking

Student registration

Admin dashboard

Analytics

Email automation

WhatsApp booking flow

Subscription-based premium access

Deploy the final app on Vercel.

Use:

Vite

React

TypeScript

Supabase

Supabase Auth

Supabase Storage

PostgreSQL

React Router

React Hook Form

Zod

Framer Motion

Lucide React

Do not use:

TanStack Query

Generic LMS templates

Placeholder pages

Demo-only content

Fake workflows

Overly broad, vague, or generic implementation

Everything must be clear, specific, and production-ready.

BRAND IDENTITY

Use the provided CatchUp Tutors logo and visual style.

Brand message:
**Catch Up. **Stay Ahead.

The website should feel premium, modern, energetic, academic, trustworthy, and achievement-focused.

Brand colors:

Blue: #0057D9

Orange: #FF6B1A

Green: #63C64D

Navy: #0A1931

Grey: #667085

Background: #F5F7FA

Typography:

Headings: Poppins

Body: Inter

Visual style:

Modern EdTech

Premium SaaS

Minimal but dynamic

Strong whitespace

Clean cards

Rounded corners

Soft shadows

Smooth motion

Clear hierarchy

Mobile-first responsive design

The homepage and all major pages should visually echo the branding board:

dark premium hero section

bold achievement-focused headline

upward growth visuals

student success imagery

energetic color accents

polished dashboard-like layout

CORE PLATFORM GOAL

CatchUp Tutors helps students:

learn Mathematics and Further Mathematics

access Cambridge and IGCSE resources

download yearly past questions and marking schemes

study topic-based questions with solutions

watch embedded learning videos directly on the platform

book one-on-one tutoring sessions

subscribe for premium video learning

connect with tutors professionally

track progress and attendance

The design should clearly communicate:
academic improvement, confidence, progress, and measurable success.

USER ROLES

Create role-based access control for three user roles:

1. Student

Students can:

register and sign in

browse programs, subjects, topics, and resources

view free videos

unlock premium content after payment

book tutors

view booking history

receive email confirmations

use WhatsApp booking flow

access a personal dashboard

2. Tutor

Tutors can:

register as tutor applicants

have profiles approved by admin

manage profile details

list subjects/topics taught

set pricing

manage availability

receive booking notifications

access tutor dashboard

view assigned sessions

Tutors must not receive student phone numbers directly.

3. Admin

Admin can:

approve tutors

upload and edit resources

upload videos

manage programs, subjects, topics, and years

manage bookings

manage premium access

manage testimonials

manage founder/about content

view analytics

view all student contact details

oversee payments and subscriptions

edit any content on the site

INFORMATION ARCHITECTURE

Create the following top-level pages:

Home

Programs

Resources

Tutors

Pricing

About Us

Testimonials

Contact

Dashboard

Login / Register

Admin Dashboard

Tutor Dashboard

Student Dashboard

FAQ

Privacy Policy

Terms of Service

HOMEPAGE REQUIREMENTS

The homepage must be a premium conversion-focused landing page.

Hero Section

Use a minimalistic split layout inspired by the brand mockup with 2 colors:

dark premium background

strong hero headline

CTA buttons

student success image

subtle animated growth arrows or progress shapes

logo visible in navbar and hero area

Hero headline:
Catch Up.
Stay Ahead**.**

Subheadline:
Personalized tutoring, premium resources, and expert academic mentorship designed to help students excel in Mathematics and Further Mathematics.

Primary CTA:
Find a Tutor

Secondary CTA:
Explore Resources

Tertiary CTA:
Subscribe for Premium

Hero Supporting Elements

Add:

animated statistics

trust badges

success metrics

quick access chips for Cambridge and IGCSE

premium CTA for deeper learning

Example metrics:

20+ Expert Tutors

10K+ Students Helped

98% Success Rate

PROGRAMS PAGE

Create a dedicated Programs page that acts as the gateway to the learning system.

This page must show two major program cards:

1. Cambridge

Inside Cambridge:

Mathematics

Further Mathematics

2. IGCSE

Inside IGCSE:

Mathematics

Each program card should include:

program title

short description

icon or illustration

CTA to explore subjects

subtle hover animation

clear visual distinction between programs

Each program should have its own detail page.

SUBJECT STRUCTURE

Each subject must have a structured hierarchy.

Example hierarchy:
Programs → Cambridge → Mathematics → Resource Types → Topics / Years

The subject pages must be clearly organized into:

A. Yearly Past Questions

B. Topic Past Questions

C. Videos

D. Premium Learning

E. Tutor Support

RESOURCES PAGE REQUIREMENTS

The Resources page must be one of the most important sections on the platform.

It must support:

Cambridge

IGCSE

For now the subjects are:

Mathematics

Further Mathematics

This page must not be generic. It must clearly show:

the academic program

the subject

the resource type

the downloadable file or video

YEARLY PAST QUESTIONS FLOW

For each subject, create a Yearly Past Questions section.

Example:
Cambridge → Mathematics → Yearly Past Questions

Display years in a clear grid:

2025

2024

2023

2022

2021

2020

etc.

For each year, provide:

Question Paper PDF

Marking Scheme PDF

Each resource should have:

file preview

download button

resource title

year label

subject label

This should be administratively manageable from the dashboard.

TOPIC PAST QUESTIONS FLOW

Create a Topic Past Questions section for each subject.

Example:
Cambridge → Mathematics → Topic Past Questions

Topics include:

Algebra

Functions

Trigonometry

Calculus

Vectors

Statistics

Probability

Coordinate Geometry

Series

Mechanics

For each topic:

Topic Past Questions PDF

Solutions PDF

Embedded YouTube video

description

link to premium lesson if applicable

The video must play directly on the website without sending the user away from the platform.

VIDEO SYSTEM

The site must support both free and premium video content.

Free videos

Use YouTube embeds for:

public lesson videos

topic explanations

sample lessons

The video should play inline on the page.

Premium videos

Premium learning content must be behind payment/subscription access.

To avoid lock-in, implement a video provider abstraction layer so the admin can later use:

YouTube unlisted

Cloudflare Stream

Mux

Bunny Stream

Vimeo

any future provider

Build the system so the platform stores:

video title

video provider

provider URL / ID

access level

related program

related subject

related topic

Premium videos must:

require login

require active subscription

open inside the app

not redirect the user away from the platform

PREMIUM LEARNING CTA

Wherever a student is studying a topic, show a premium CTA that is specific and useful, not generic.

Example:
Want to understand this topic deeply?

Unlock premium access to:

step-by-step explanations

deeper video lessons

worked examples

tutor support

premium topic resources

Button:
Subscribe to Premium

This CTA should appear:

on topic pages

below free videos

near locked resources

on the pricing page

inside dashboards

TUTOR SYSTEM

Create a tutor directory with structured tutor profiles.

Each tutor profile must include:

name

photo

bio

subjects taught

topics taught

pricing

years of experience

qualifications

availability

rating

testimonials

contact/book button

Each tutor page must look premium and trustworthy.

TUTOR REGISTRATION FLOW

Tutors must apply before being activated.

Tutor application form fields:

full name

email

phone number

subjects taught

topics taught

qualifications

years of experience

pricing structure

biography

profile photo

CV upload

Tutor applications go to admin for approval.

Admin can:

approve

reject

request changes

Only approved tutors appear publicly.

BOOKING SYSTEM

Students must be able to book one-on-one sessions with tutors.

Booking flow:

student selects tutor

student selects subject

student selects topic

student selects preferred date and time

student chooses session type

student submits booking

booking is saved in the database

emails are sent automatically

WhatsApp booking summary is generated

admin can monitor booking status

Session platform options:

Google Meet

Zoom

WhatsApp contact flow only where appropriate

Booking should support:

one-time sessions

recurring sessions later if needed

tutor-specific pricing

time slot selection

EMAIL WORKFLOW

Set up automated transactional emails using a production-ready provider such as Resend.

When a student registers or books:

Send email to:

student

tutor

admin

Student email contains:

booking confirmation

tutor name

subject

topic

selected date and time

session type

meeting link if applicable

Tutor email contains:

student name

subject

topic

date

time

session details

Tutor must not receive student phone number.

Admin email contains:

all student details

including phone number

all tutor details

booking metadata

payment status if applicable

Also support:

password reset email

premium purchase confirmation

session reminder email

tutor approval notification

admin alert for new booking

WHATSAPP WORKFLOW

Generate a prefilled WhatsApp booking message after a student fills the booking form.

The WhatsApp message should include:

student name

tutor selected

subject

topic

preferred date

preferred time

session type

pricing information

The student should be able to click once and send the message to the tutor/admin booking contact.

STUDENT DASHBOARD

Create a clean student dashboard with these areas:

profile overview

booked sessions

premium access status

saved resources

recently viewed topics

downloaded files

attendance history

subscription plan

recommended resources

tutor messages or booking updates

The dashboard should feel like a learning control center.

TUTOR DASHBOARD

Create a tutor dashboard with:

profile management

availability management

booking requests

confirmed sessions

pricing management

topic list

earnings summary

student engagement stats

reviews and ratings

notifications

Tutors should be able to update availability and pricing themselves, but admin must still control final visibility.

ADMIN DASHBOARD

Create a robust admin dashboard with the ability to:

add/edit/delete programs

add/edit/delete subjects

add/edit/delete topics

upload PDFs

upload marking schemes

upload solutions

attach YouTube or other video URLs

mark resources as free or premium

manage yearly questions

manage topic questions

manage tutors

approve applications

manage bookings

manage subscriptions

manage testimonials

edit About Us content

edit founder details

view analytics

export reports

This dashboard should feel like a real internal admin system, not a basic CMS.

TESTIMONIALS SECTION

The testimonials section must be animated and lively.

Requirements:

testimonials move in and out smoothly

flip animation

auto-rotating cards

manual navigation

student name

program studied

testimonial text

star rating

optional student photo

This section should not be static.

ABOUT US PAGE

The About Us page must tell the real story behind the brand.

It should include:

founder name

founder biography

founder photo

mission

vision

why CatchUp Tutors was created

teaching philosophy

journey and background

achievements

company purpose

Create a premium founder story layout with a timeline or profile-style storytelling section.

PRICING PAGE

Create a clear pricing page with subscription tiers.

Example tiers:

Free

Premium Monthly

Premium Quarterly

Premium Yearly

Each tier should clearly explain:

what is included

what is locked

access to premium videos

access to premium resources

tutor booking benefits

Include a strong CTA:
Start Premium Learning

CONTACT PAGE

Include:

contact form

WhatsApp contact button

email contact

social links:

Instagram

Facebook

YouTube

Contact form should be functional and stored in Supabase.

ANALYTICS

Admin analytics must track:

number of students

number of tutors

bookings made

revenue

resource downloads

most viewed topics

most watched videos

premium conversion rate

tutor performance

testimonial engagement

Show analytics using visually clear charts and cards.

DATABASE DESIGN

Create a complete Supabase/PostgreSQL schema with relationships and validation logic.

Tables should include at minimum:

users

student_profiles

tutor_profiles

tutor_applications

programs

subjects

topics

yearly_past_questions

topic_past_questions

resources

videos

premium_subscriptions

bookings

attendance

testimonials

contact_messages

notifications

analytics_events

payments

founder_profile

settings

Each table should support:

created_at

updated_at

soft delete if needed

relationships

indexing

role-based permissions

AUTHENTICATION AND SECURITY

Implement:

sign up

login

logout

password reset

email verification

role-based protected routes

secure file access

subscription-gated pages

admin-only routes

tutor-only routes

student-only routes

Also implement:

input validation

error states

loading states

empty states

retry logic where relevant

friendly error messages

SEARCH AND FILTERING

The platform must support fast searching and filtering across:

programs

subjects

topics

years

resource types

tutors

videos

Search should be usable and obvious.

RESPONSIVE DESIGN

The full website must be excellent on:

desktop

laptop

tablet

mobile

The mobile experience should still feel premium and smooth.

SEO REQUIREMENTS

Implement:

unique page titles

meta descriptions

Open Graph tags

Twitter card support

semantic headings

sitemap

robots.txt

structured data for educational content

clean URLs

PERFORMANCE REQUIREMENTS

The app must be production-ready with:

code splitting

lazy loading

optimized images

reusable components

efficient state handling

fast initial load

polished motion without hurting performance

FINAL DEVELOPMENT REQUIREMENTS

Build the full system with:

clean project structure

reusable components

proper folder organization

maintainable architecture

real data flows

complete API and DB integration

production-ready forms

strong validation

no missing routes

no broken links

no dummy placeholders in core flows

Everything should be clearly implemented so the platform can be deployed directly to Vercel.

FINAL PRODUCT GOAL

The final website should feel like a premium Cambridge and IGCSE academic growth platform.

It must be:

functional

polished

specific

scalable

monetizable

beautiful

easy to manage

ready for real students, tutors, and admin operations

The experience should guide users through this journey:

Free discovery
→ browse programs
→ find subject resources
→ watch free lessons
→ access topic questions
→ encounter premium learning CTA
→ subscribe
→ book a tutor
→ receive email/WhatsApp confirmation
→ attend class
→ track progress

The entire product must reinforce the brand message:

Catch Up. Stay Ahead.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7b67fd98-36d5-4de5-8725-965901718865).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
