# RNHT Temple - Apple App Store Submission Guide

## 1. App Store Connect Setup

### Step 1: Register the Bundle ID
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Click **Identifiers** > **+** button
3. Select **App IDs** > **App**
4. Enter:
   - **Description:** RNHT Temple
   - **Bundle ID (Explicit):** `org.rnht.app`
5. Under **Capabilities**, enable: (none required - basic app)
6. Click **Continue** > **Register**

### Step 2: Create the App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com/apps)
2. Click **+** > **New App**
3. Fill in:
   - **Platforms:** iOS
   - **Name:** `RNHT Temple`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `org.rnht.app`
   - **SKU:** `rnht-temple-app`
   - **User Access:** Full Access
4. Click **Create**

---

## 2. App Store Metadata (Copy-Paste Ready)

### App Name (30 chars max)
```
RNHT Temple
```

### Subtitle (30 chars max)
```
Hindu Temple Services Austin
```

### Promotional Text (170 chars max)
```
Book authentic Vedic poojas, homams & spiritual services with experienced priests. Serving Hindu families across Texas with traditional rituals and personalized ceremonies.
```

### Description (4000 chars max)
```
RNHT Temple (Rudra Narayana Hindu Temple) is your complete companion for Hindu spiritual services in Austin, Texas and surrounding areas.

BOOK VEDIC SERVICES
Browse and book from over 50 authentic Vedic services including:
- Daily & special poojas (Ganesh Pooja, Lakshmi Pooja, Satyanarayana Pooja, and more)
- Sacred homams (Ganapathi Homam, Navagraha Homam, Sudarshana Homam)
- All 16 Samskaras (Namakaranam, Annaprasana, Upanayanam, Vivah/Wedding)
- Grihapravesham (housewarming ceremonies)
- Shradh & memorial services
All ceremonies performed following authentic Krishna Yajurvedam traditions.

EXPERIENCED PRIESTS
Our priests bring over 35 years of combined experience. Services available in English, Telugu, Tamil, Hindi, and Sanskrit. Every ceremony includes step-by-step explanations so you understand the spiritual significance.

HOME & TEMPLE SERVICES
We come to you! Ceremonies performed at your home, office, or any venue across Texas — serving Austin, Kyle, Manor, Round Rock, Georgetown, San Antonio, and 12+ cities.

DAILY PANCHANGAM
Stay connected to the Hindu calendar with daily Panchangam information including tithi, nakshatra, yoga, and karana — right on your home screen.

TEMPLE EVENTS & FESTIVALS
Never miss a celebration. Browse upcoming festivals, community events, regular poojas, and educational classes. RSVP directly through the app.

SUPPORT THE TEMPLE
Make secure donations to various temple funds. RNHT is a registered 501(c)(3) nonprofit — all contributions are tax-deductible. Support via card payments or other methods.

LIVE DARSHAN & STREAMING
Watch daily aarti and special ceremonies through our live streaming feature. Stay spiritually connected even from a distance.

COMMUNITY & EDUCATION
Join our growing community of Hindu families. Access educational resources on Vedic philosophy, rituals, and traditions. Explore classes in dance, music, yoga, and more.

RNHT Temple — Bringing authentic Vedic traditions to your doorstep.
```

### Keywords (100 chars max, comma-separated)
```
hindu,temple,pooja,vedic,homam,priest,austin,texas,puja,panchangam,donation,spiritual,ceremony
```

### Category
- **Primary Category:** Lifestyle
- **Secondary Category:** Reference

### URLs
- **Support URL:** `https://rnht-platform.web.app/contact`
- **Privacy Policy URL:** `https://rnht-platform.web.app/privacy`
- **Marketing URL:** `https://rnht-platform.web.app`

### Copyright
```
2024 Rudra Narayana Hindu Temple
```

---

## 3. Age Rating Questionnaire

Answer ALL questions as follows when filling out the age rating in App Store Connect:

| Question | Answer |
|----------|--------|
| Cartoon or Fantasy Violence | None |
| Realistic Violence | None |
| Prolonged Graphic or Sadistic Realistic Violence | None |
| Profanity or Crude Humor | None |
| Mature/Suggestive Themes | None |
| Horror/Fear Themes | None |
| Medical/Treatment Information | None |
| Simulated Gambling | None |
| Real Gambling | None |
| Sexual Content and Nudity | None |
| Graphic Sexual Content and Nudity | None |
| Alcohol, Tobacco, or Drug Use or References | None |
| Unrestricted Web Access | No |
| Contests | None |

**Result:** Rated 4+ (appropriate for all ages)

---

## 4. App Privacy Details

In App Store Connect > App Privacy, declare the following:

### Data Types Collected

#### 1. Contact Info
- **Name** — Collected for user profile
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

- **Email Address** — Collected for account and booking confirmations
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

- **Phone Number** — Collected for service booking contact
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

- **Physical Address** — Collected for home service visits
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

#### 2. Financial Info
- **Payment Info** — Processed via Stripe (not stored by app)
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

#### 3. User Content
- **Other User Content** — Family member details (gotra, nakshatra, rashi)
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

#### 4. Identifiers
- **User ID** — Supabase authentication user ID
  - Linked to User Identity: **Yes**
  - Purpose: **App Functionality**
  - Tracking: **No**

### Data NOT Collected
- Location data
- Health & Fitness data
- Browsing history
- Search history
- Diagnostics
- Usage data (no analytics)

---

## 5. Screenshots Guide

### Required Screenshot Sizes

| Device | Resolution | Required? |
|--------|-----------|-----------|
| 6.7" iPhone (iPhone 15 Pro Max) | 1290 x 2796 | **Yes** |
| 6.5" iPhone (iPhone 11 Pro Max) | 1242 x 2688 | **Yes** |
| 5.5" iPhone (iPhone 8 Plus) | 1242 x 2208 | Recommended |
| 12.9" iPad Pro (3rd gen+) | 2048 x 2732 | **Yes** (if iPad supported) |

### How to Take Screenshots
1. Open Xcode > **Window** > **Devices and Simulators**
2. Or use Simulator directly: **File** > **Open Simulator**
3. Select required device sizes
4. Run the app in each simulator
5. Press **Cmd + S** to take a screenshot (saves to Desktop)

### Recommended Screenshots (5-8 per device)
1. **Home screen** — Hero section with temple branding
2. **Services list** — Browse all pooja categories
3. **Service detail** — A specific pooja with pricing
4. **Panchangam widget** — Daily Hindu calendar
5. **Events calendar** — Upcoming festivals and events
6. **Donation page** — Support the temple
7. **Priest profiles** — Meet our priests
8. **Live streaming** — Watch ceremonies live

### Screenshot Tips
- Use real/sample data, not empty states
- Ensure status bar shows a clean time (use Simulator > Features > Toggle Appearance)
- No placeholder content visible
- Apple allows adding device frames and marketing text using tools like Fastlane Frameit or screenshots.pro

---

## 6. Build & Upload Steps (Xcode on Mac)

### Prerequisites
- macOS with latest Xcode installed
- Apple Developer account signed in to Xcode
- Node.js installed

### Step 1: Build the Web App
```bash
cd rnht-platform
npm install
npx next build
```
This generates the static `out/` directory.

### Step 2: Sync to iOS
```bash
npx cap sync ios
```
This copies the web build into the iOS native project.

### Step 3: Open in Xcode
```bash
npx cap open ios
```
Or manually open: `ios/App/App.xcworkspace`

> **IMPORTANT:** Open the `.xcworkspace` file, NOT the `.xcodeproj` file.

### Step 4: Configure Signing
1. Select the **App** target in the project navigator
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** (your Apple Developer account)
5. Xcode will automatically create the provisioning profile

### Step 5: Set Version & Build Number
1. In the **General** tab:
   - **Version:** `1.0.0`
   - **Build:** `1` (increment for each upload)

### Step 6: Select Device
1. In the toolbar, select **Any iOS Device (arm64)** as the build target
   - Do NOT select a simulator — you need a real device build for archiving

### Step 7: Archive
1. **Product** > **Archive** (menu bar)
2. Wait for the build to complete (may take a few minutes)
3. The Organizer window opens automatically

### Step 8: Upload to App Store Connect
1. In Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Select **Upload**
5. Keep default options (Strip Swift symbols, Upload symbols)
6. Click **Upload**
7. Wait for upload to complete

### Step 9: Wait for Processing
- Apple processes the build (usually 15-30 minutes)
- You'll receive an email when it's ready
- Check App Store Connect > TestFlight or the iOS App section

---

## 7. Common Rejection Reasons to Avoid

### 1. Incomplete Information
- Ensure ALL metadata fields are filled
- Include a valid demo account if login is required
  - Add demo credentials in **App Review Information** > **Notes**

### 2. Broken Links
- Verify privacy policy URL works: `https://rnht-platform.web.app/privacy`
- Verify support URL works: `https://rnht-platform.web.app/contact`

### 3. Crashes or Bugs
- Test on multiple device sizes before submission
- Test all navigation flows end-to-end
- Ensure Stripe payment doesn't crash in test mode

### 4. Login/Authentication Issues
- If login is required, provide demo credentials to the reviewer
- Ensure sign-up flow works without errors

### 5. Payments (Guideline 3.1.1)
- **Physical services** (like pooja bookings) CAN use Stripe — no need for In-App Purchase
- **Digital goods** (if any) MUST use Apple In-App Purchase
- Temple donations for services rendered at a physical location are exempt from IAP requirement

### 6. Privacy
- App Privacy labels must match actual data collection
- Privacy policy must be accessible and accurate

### 7. Minimum Functionality (Guideline 4.2)
- App must offer more than just a website wrapper
- Ensure native features like splash screen, status bar styling work properly
- Consider adding push notifications or offline support to enhance native feel

### 8. iPad Support
- If supporting iPad, test layouts on iPad screen sizes
- App must work properly in all declared orientations

---

## 8. Pre-Submission Checklist

### App Store Connect
- [ ] App created in App Store Connect
- [ ] Bundle ID registered in Developer Portal
- [ ] App name, subtitle, and description entered
- [ ] Keywords entered
- [ ] Category set to Lifestyle / Reference
- [ ] Privacy policy URL entered and working
- [ ] Support URL entered and working
- [ ] Age rating questionnaire completed
- [ ] App Privacy details filled out
- [ ] Copyright text entered

### Screenshots & Media
- [ ] 6.7" iPhone screenshots uploaded (minimum 3)
- [ ] 6.5" iPhone screenshots uploaded (minimum 3)
- [ ] 12.9" iPad screenshots uploaded (if supporting iPad)
- [ ] App icon displays correctly (auto-pulled from binary)

### Build
- [ ] Web app builds successfully (`npx next build`)
- [ ] Capacitor sync completes (`npx cap sync ios`)
- [ ] App runs on iOS Simulator without crashes
- [ ] App archived and uploaded to App Store Connect
- [ ] Build processed successfully (no email warnings)
- [ ] Build selected in App Store Connect version

### Testing
- [ ] All pages load correctly (Home, Services, Events, Donate, etc.)
- [ ] Navigation works throughout the app
- [ ] Stripe payment flow doesn't crash
- [ ] Login/signup works (if applicable)
- [ ] App works in airplane mode (graceful error handling)
- [ ] Tested on iPhone SE (small screen)
- [ ] Tested on iPhone 15 Pro Max (large screen)
- [ ] Tested on iPad (if supporting)

### Review Information
- [ ] Contact info for app reviewer entered
- [ ] Demo account credentials provided (if login required)
- [ ] Notes for reviewer explaining app purpose (temple service app)
- [ ] Review submitted!

---

## 9. App Review Information (Notes for Reviewer)

Copy-paste this into the **Notes** field in App Review Information:

```
RNHT Temple is the official app for Rudra Narayana Hindu Temple, a 501(c)(3) nonprofit organization in Austin, Texas.

The app allows Hindu families to browse and book traditional Vedic pooja services, view the temple event calendar, make donations, and connect with temple priests.

Key features:
- Browse 50+ Vedic services with descriptions and pricing
- View daily Panchangam (Hindu calendar)
- RSVP for temple events and festivals
- Make donations via Stripe (for physical temple services - exempt from IAP per guideline 3.1.1)
- Watch live-streamed ceremonies

No login is required to browse services and events. Account creation is optional for booking services.

Contact for questions: (512) 545-0473
```

---

## 10. After Submission

- **Review Time:** Typically 24-48 hours (can be up to 7 days for first submission)
- **If Rejected:** Read the rejection reason carefully, fix the issue, and resubmit
- **If Approved:** The app goes live on the App Store!
- **Updates:** For future updates, increment the build number and repeat the Archive/Upload process
