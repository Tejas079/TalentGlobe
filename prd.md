Design a polished, production-quality desktop web application prototype called **TALENT GLOBE**.

The product is a new professional self-advertising marketplace where people pay for visibility and are discovered through an interactive 3D world.

The central product idea is:

**Advertise Yourself to the World.**

This must NOT look like LinkedIn, Indeed, Upwork, or a conventional recruitment dashboard.

It should feel like a combination of:

**Google Earth + premium digital advertising + Times Square + futuristic talent marketplace.**


### 0. DELIVERABLE AND CONSTRAINTS

Output: a single self-contained HTML file. three.js via CDN for the globe.
No build step, no external assets beyond CDN libraries.
Scope: landing page + globe + profile card + search overlay ONLY.
No pricing page, no signup flow, no routing.

All data is mock and hardcoded in the file.

Density rules:
- 120 profile markers total in the dataset.
- At default zoom, cluster markers into count-bubbles per region.
- Render individual avatars only past a zoom threshold, max 40 on screen.
- Markers on the far side of the globe are occluded, not drawn through it.
- Must hold 60fps on a mid-range laptop.

Mock content:
- 120 profiles spread realistically across 6 continents, weighted to
  India, SEA, Europe, US, Brazil, Nigeria.
- Names, titles and cities should reflect that spread — not US-default.
- Avatars: generated initials on coloured circles. No stock photography.

Palette: near-black base (#0A0A0C), one warm accent for premium tiers,
one cool accent for UI chrome. No cyan/magenta pairing. Max two accents total.
Typography: one geometric sans, two weights.

FRONT OF GLOBE mechanic: [pick one of the three options above and describe it here]


### 1. HERO EXPERIENCE

The entire homepage should be dominated by a large, realistic, cinematic **3D Earth** floating in a dark premium environment.

The Earth is the primary interface, not a decorative background.

Show:

* Realistic continents
* City lights on the night side
* Atmospheric glow
* Subtle clouds
* Stars/particles in the background
* Smooth cinematic lighting
* Hundreds of tiny professional profile markers distributed geographically across the world

The globe should visually communicate:

**Millions of professionals. One world.**

Allow the prototype to visually represent:

* Slow automatic rotation
* Drag-to-rotate interaction
* Zoom in/out
* Clicking profile markers
* Searching and filtering talent
* Zooming toward countries and cities

### 2. PROFILE GEOGRAPHY

Every professional profile is represented by a circular profile photo/avatar positioned according to their real geographic location.

Important:

**Geographic location and advertising prominence are separate concepts.**

A person's marker remains geographically positioned where they are located.

Premium advertising does NOT move the person to a different geographic location.

Instead, paid visibility changes:

* Avatar size
* Glow intensity
* visual prominence
* label visibility
* spotlight effects
* priority in discovery
* duration of promotional visibility

Free users should appear as small, subtle markers.

Premium users should progressively become more visually dominant.

### 3. PREMIUM VISIBILITY

The core monetization model is professional advertising.

Users are paying for attention and visibility, not purchasing a traditional recruitment subscription.

Create five clearly differentiated advertising tiers:

**FREE**

Small profile marker with minimal visual prominence.

**₹99**

Slightly larger marker with subtle highlight.

**₹499**

Larger profile image, glow effect, increased visibility.

**₹1,999**

Large premium profile, stronger glow, priority discovery and enhanced visibility.

**₹9,999**

Elite premium advertising package with access to limited **FRONT OF GLOBE** inventory.

Make the pricing hierarchy visually obvious.

The higher the tier, the more visually dominant the profile becomes.

### 4. FRONT OF GLOBE

Create a visually impressive premium advertising system called:

**FRONT OF GLOBE**

Reserve a limited number of premium positions on the front-facing portion of the globe.

Example:

**20 GLOBAL SPOTLIGHTS**

Display premium profiles significantly larger than standard profile markers.

Use labels such as:

**#1 GLOBAL SPOTLIGHT**

**#2 GLOBAL SPOTLIGHT**

**#3 GLOBAL SPOTLIGHT**

etc.

These positions should feel like premium digital advertising inventory.

They should feel scarce, prestigious and highly visible, but NOT like gambling or a casino.

The geographic location of each person remains accurate; the premium treatment controls visual prominence.

### 5. PROFILE CARD

When the user clicks a profile marker, open a floating glassmorphism profile card over the globe.

Example:

**Rahul Sharma**

Full-Stack Developer

Pune, India

React · Node.js · AWS · PostgreSQL

8 years experience

**AVAILABLE FOR OPPORTUNITIES**

[ View Profile ]
[ Contact ]

The card should look like a premium digital advertisement rather than a résumé page.

Use profile photography prominently.

### 6. SEARCH AND DISCOVERY

Place a sophisticated search interface above or overlapping the globe.

Primary search:

**Search talent...**

Category filters:

Developer
Designer
Marketing
Sales
Finance
Consultant
Freelancer
Student
Creator
Founder
Other

Also provide:

Country
City
Availability
Experience
Skills

When a category is selected, visually highlight matching profiles on the globe and reduce the opacity of non-matching profiles.

### 7. LANDING PAGE CONTENT

Top navigation:

**Explore | Categories | How It Works | Pricing | Sign In**

Brand:

**TALENT GLOBE**

Hero headline:

**Advertise Yourself to the World.**

Supporting copy:

**Put your skills on the map. Get discovered by the people looking for you.**

Primary CTA:

**Advertise Yourself**

Secondary CTA:

**Explore Talent**

Include subtle live-style statistics:

**12,842 professionals advertising**

**187 countries represented**

### 8. VISUAL LANGUAGE

Use an extremely premium futuristic technology aesthetic.

Primary visual characteristics:

* Deep black / charcoal environment
* Realistic Earth
* Glassmorphism panels
* Subtle gradients
* Thin luminous borders
* Soft atmospheric lighting
* Cinematic depth
* Tiny stars and particles
* City lights
* Floating profile images
* Elegant typography
* Smooth micro-interactions
* High-end startup presentation

Avoid:

* Generic SaaS dashboard layouts
* LinkedIn visual language
* Corporate blue-heavy recruitment websites
* Tables as the primary interface
* Dense résumé layouts
* Cartoon-style graphics
* Cheap neon cyberpunk aesthetics

The product should feel sophisticated, expensive and technologically advanced.

### 9. RESPONSIVE DESIGN

Design the experience for:

* Large desktop screens
* Laptop screens
* Tablet
* Mobile

Desktop should emphasize the massive globe.

Mobile should transform the globe into a focused interactive viewport with simplified controls while preserving the central concept of discovering professionals around the world.

### 10. MOST IMPORTANT DESIGN PRINCIPLE

The globe is simultaneously:

**1. A map of global talent**

and

**2. A giant interactive advertising surface**

The first-time user should immediately understand:

**People are buying visibility.**

The UI should make someone instinctively want to:

**rotate the Earth → discover profiles → click someone → inspect their professional identity → advertise themselves.**

Create a visually spectacular, high-fidelity product prototype that looks like a real startup preparing for launch.

Prioritize the **hero experience, globe, profile markers, premium advertising hierarchy, Front of Globe inventory, typography, layout, and visual polish** over backend functionality.

The final result should look like a product that could be shown to investors on a startup demo day.
