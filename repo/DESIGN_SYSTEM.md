# وفرها منورة (Waffarha Monawara) - Design System Documentation

## 🎨 Design Philosophy

A world-class IoT energy platform featuring ultra-modern, futuristic UI with:
- **Dark Mode First**: Optimized for energy-conscious displays
- **Neon Accents**: Electric green (#00ff88) and blue (#00d4ff) energy theme
- **Glassmorphism**: Translucent cards with backdrop blur effects
- **Smooth Animations**: Motion-ready components for premium feel

---

## 🎨 Color Palette

### Primary Colors
- **Neon Green**: `#00ff88` - Main brand color, energy savings
- **Electric Blue**: `#00d4ff` - Accent color, technology
- **Dark Background**: `#0a0a0f` - Main background
- **Dark Card**: `#12121a` - Card backgrounds

### Status Colors
- **Normal/Success**: `#00ff88` (Neon Green)
- **Warning**: `#ffaa00` (Orange)
- **Critical/Error**: `#ff4444` (Red)
- **Offline**: `#666666` (Gray)

### Neutral Colors
- **Text Primary**: `#f0f0f5` (Near white)
- **Text Muted**: `#8a8a95` (Gray)
- **Border**: `rgba(255, 255, 255, 0.1)` (Subtle white)

---

## 🧩 Components

### Logo Component
**Location**: `/src/app/components/Logo.tsx`

Features:
- Lightning bolt icon in gradient circle
- Pulsing glow animation
- Three sizes: sm, md, lg
- Arabic + English branding

### GlassCard Component
**Location**: `/src/app/components/GlassCard.tsx`

Features:
- Glassmorphism effect with backdrop blur
- Optional hover state
- Optional glow (green/blue/none)
- Rounded corners with subtle borders

### StatusIndicator Component
**Location**: `/src/app/components/StatusIndicator.tsx`

Status types:
- Normal (green)
- Warning (orange)
- Critical (red)
- Online (green)
- Offline (gray)

Features:
- Animated pulsing dot
- Colored background and border
- Glow effect

### Navigation Component
**Location**: `/src/app/components/Navigation.tsx`

Features:
- Fixed top navigation with glassmorphism
- Active state indicators
- Mobile responsive menu
- Gradient CTA button

---

## 📱 Pages

### 1. Landing Page (`/`)
**Location**: `/src/app/pages/LandingPage.tsx`

Sections:
- Hero with animated grid background
- Floating stats cards
- How It Works (3-step diagram)
- Features grid (6 features)
- CTA section
- Footer

### 2. Dashboard (`/dashboard`)
**Location**: `/src/app/pages/Dashboard.tsx`

Features:
- Real-time consumption display
- Smart energy budget with progress bar
- Live consumption graph (Area Chart)
- Weekly usage chart (Bar Chart)
- Alert system
- Quick actions panel
- Energy saving tips

### 3. User Setup (`/setup`)
**Location**: `/src/app/pages/UserSetup.tsx`

3-Step Wizard:
1. Home Information (rooms, sockets)
2. Device Selection (appliances)
3. Auto-generated energy plan

### 4. Device Status (`/device`)
**Location**: `/src/app/pages/DeviceStatus.tsx`

Features:
- Live device status with pulsing animation
- Network statistics (signal, latency, uptime)
- Data flow visualization
- Connection history
- Device information panel

### 5. Insights & Recommendations (`/insights`)
**Location**: `/src/app/pages/Insights.tsx`

Features:
- AI-powered recommendations (priority-based)
- Potential savings calculator
- Energy saving tips
- Achievements system with progress
- Weekly challenges
- Impact summary (CO₂, money saved)

---

## 🎭 Design Patterns

### Glassmorphism Effect
```css
background: rgba(18, 18, 26, 0.7);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 16px;
```

### Neon Glow
```css
/* Green Glow */
box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);

/* Blue Glow */
box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
```

### Gradient Text
```css
background: linear-gradient(135deg, #00ff88, #00d4ff);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Gradient Button
```css
background: linear-gradient(90deg, #00ff88, #00d4ff);
color: #0a0a0f;
```

---

## 📊 Charts & Data Visualization

Using **Recharts** library:

### Area Chart (Real-time consumption)
- Gradient fill from neon green
- Smooth curves
- Grid background
- Custom tooltip

### Bar Chart (Weekly usage)
- Electric blue bars
- Rounded top corners
- Grid background

---

## ✨ Animations

Using **Motion (Framer Motion)** library:

### Fade In Up
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

### Pulsing Effect
```tsx
<motion.div
  animate={{ scale: [1, 1.05, 1] }}
  transition={{ duration: 2, repeat: Infinity }}
>
```

### Stagger Children
Delays each item by 0.1s for smooth sequential animations

---

## 🎯 UX Principles

1. **Immediate Feedback**: All interactions provide visual feedback
2. **Progressive Disclosure**: Complex data revealed through cards
3. **Status Awareness**: Clear indicators for device and system status
4. **Actionable Insights**: Every recommendation has clear next steps
5. **Gamification**: Achievements and challenges for engagement

---

## 📐 Spacing & Layout

- **Max Width**: 7xl (1280px) for main content
- **Card Padding**: 24px (p-6)
- **Section Spacing**: 80px vertical (py-20)
- **Grid Gaps**: 24px (gap-6)
- **Border Radius**: 16px for cards, 8px for small elements

---

## 🚀 Performance Optimizations

- Lazy loading for heavy components
- Optimized images from Unsplash
- CSS animations over JS when possible
- Backdrop blur with fallbacks
- Responsive images with proper sizing

---

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

All components are fully responsive with mobile-first approach.

---

## 🎨 Typography

- **Font Family**: System fonts (optimized for performance)
- **Headings**: Bold, gradient or white
- **Body**: Regular, gray-400
- **Numbers**: Bold, accent colors

---

## 🌟 Special Effects

### Hover States
- Scale: 1.02
- Increased border opacity
- Enhanced glow

### Loading States
- Pulsing animations
- Skeleton screens (where needed)
- Smooth transitions

### Success States
- Green checkmarks
- Celebration animations
- Positive feedback

---

## 🔧 Technical Stack

- **Framework**: React 18.3
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Animations**: Motion (Framer Motion)
- **Icons**: Lucide React

---

## 📝 Best Practices

1. Always use GlassCard for content containers
2. Apply appropriate glow effects for emphasis
3. Use StatusIndicator for all status displays
4. Maintain consistent spacing (6-unit grid)
5. Test dark mode readability
6. Ensure hover states on interactive elements
7. Add loading states for async operations
8. Keep animations subtle and purposeful

---

## 🎯 Brand Voice

- **Modern**: Cutting-edge technology
- **Empowering**: User has control
- **Eco-conscious**: Sustainability focus
- **Smart**: AI-powered intelligence
- **Accessible**: Arabic + English support

---

## 🌐 Accessibility

- High contrast ratios
- Keyboard navigation support
- ARIA labels where needed
- Focus indicators
- Semantic HTML

---

## 📄 License

© 2026 وفرها منورة (Waffarha Monawara). All rights reserved.
