# Hertz Application Redesign & Comprehensive Bug Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the representative Hero landing screen with an academic slogan, move module navigation cleanly to the top without horizontal scrollbars, eliminate fake statistics, fix visual and calculation bugs across Modules 02-06, and bring back the classical marble bust sculpture in Module 07 with clean materials and GPU tessellation.

**Architecture:** 
1. Re-introduce an executive, full-height Hero Section featuring the Apple-grade interactive 3D Display Anatomy / Photonic Lens, an academic slogan, key metrics overview, and smooth scroll affordance into the modules.
2. Unify the top navigation bar into a modern Apple-style non-overflowing segment bar (with category groupings and hotkeys) integrated directly into the header/HUD.
3. Fix coordinate transformations in the Input Lag canvas, physical microfreeze stalling in Frame Pacing, side-by-side retinal blur in Motion Blur, overlay z-index collisions in Tearing, and completely redesign AI Frame Generation into an intuitive 3-stage pipeline (Real GPU -> AI Flow Vector -> Interpolated Frame).
4. Restore Apollo marble sculpture in Module 07 with clean procedural pedestal, removing yellow dots and reflection distortions, backed by interactive polygon count scaling (2,000 to 60,000 polys).

**Tech Stack:** React 19, Three.js, Lucide Icons, Tailwind CSS, Web Audio API, Canvas 2D API.

---

## Global Constraints
- Target directory: `C:\google\fps-lab-v2` only. `C:\google\fps-site` must NEVER be modified.
- High-end Apple Pro / Academic lab aesthetic (`#f8fafc` light background, ultra-sharp typography, glassmorphism, zero gaming cliches).
- Zero fake metrics: remove fake visitor counters (`• 16 online  • 2 843 визитов`), retain only genuine hardware telemetry (FPS, ms frametime, detected screen Hz, audio toggle, Keynote fullscreen toggle).
- No horizontal scrolling sliders for module buttons on desktop or standard laptop resolutions.

---

## Review Focus
1. Title Screen & Scroll: The user should see a complete, impressive first screen with a scientific slogan and smooth transition to Module 01 on scroll or click.
2. Navigation: Top navigation must be compact, fully visible without horizontal scrollbar sliders, and allow instant jumping to any module.
3. Module 02 Motion Blur: Clear, distinct contrast between Sample-and-Hold blur, Camera Shutter blur, and BFI strobing on high-contrast text and moving markers.
4. Module 03 Tearing: Zero overlapping text (`ДЕРЖКА ВВОДА` bug completely removed; clean layout).
5. Module 04 Frame Pacing: Physical moving object that visibly freezes during microfreeze injection (+58ms).
6. Module 05 Input Lag: Blue crosshair tracks mouse cursor 1:1 without offset; clear 125 Hz vs 1000 Hz mouse polling quantization simulation.
7. Module 06 AI Frame Generation: Crystal-clear, intuitive demonstration of DLSS/FSR frame generation with real vs interpolated frames and ghosting artifacts.
8. Module 07 GPU Stress: Classical sculpture bust restored with clean studio pedestal, no yellow dots, and scalable geometry density.

---

### Task 1: Clean Dynamic Island HUD (Remove Fake Telemetry)
**Files:**
- Modify: `src/components/DynamicIslandHUD.tsx`
- Modify: `src/App.tsx`
- Test: Playwright check for real telemetry only

**Steps:**
- [ ] Remove `16 online` and `2 843 визитов` fake badges from `DynamicIslandHUD.tsx`.
- [ ] Retain real live FPS meter, exact frametime ms, detected monitor Hz, Keynote Fullscreen `[F]` toggle, and tactile sound toggle.
- [ ] Ensure HUD pill stays compact and centered at the top of the viewport.

---

### Task 2: Executive Hero Screen & Top Clean Navigation
**Files:**
- Modify: `src/components/HeroScreen.tsx`
- Modify: `src/components/StationNavigation.tsx`
- Modify: `src/App.tsx`
- Test: Verify full-screen presentation on initial load and smooth scroll to Module 01

**Steps:**
- [ ] Implement inspiring academic slogan in `HeroScreen.tsx`:  
  *«Истинная плавность — не в абстрактных цифрах FPS, а во времени доставки каждого фотона на сетчатку глаза.»*  
  *Мультимедийное исследование субмиллисекундного отклика, кинематики развертки и биологии человеческого зрения.*
- [ ] Feature the clean, interactive 3D «Анатомия дисплея» (Apple Hardware / Photonic core) with subtle interaction and smooth floating physics.
- [ ] Add a clean call-to-action button `[Перейти к исследованию ↓]` and an arrow indicator that smoothly scrolls into Module 01.
- [ ] Redesign `StationNavigation.tsx`:
  - Place navigation at the top of the page under the header.
  - Group 7 modules logically into compact badges:
    * `[01 FPS & Плавность]`
    * `[02 Motion Blur]`
    * `[03 Tearing]`
    * `[04 Frame Pacing]`
    * `[05 Input Lag]`
    * `[06 AI Frame Gen]`
    * `[07 GPU Стресс]`
  - Wrap buttons neatly so there is NO horizontal slider scrollbar!

---

### Task 3: Fix Module 02 (Motion Blur & BFI Real Contrast)
**Files:**
- Modify: `src/components/stations/Station2MotionBlur.tsx`
- Test: Visual verification of blur modes

**Steps:**
- [ ] Add high-contrast test target options (e.g. sharp high-frequency text "HERTZ 180Hz" and high-detail spacecraft with vertical bars).
- [ ] Implement exaggerated retinal persistence blur simulation for `Sample-and-Hold` (eye-tracking smear).
- [ ] Implement true optical shutter blur for `Motion Blur` with 180° / 360° shutter angles.
- [ ] Implement authentic Black Frame Insertion (`BFI`) with black pulse strobing that visibly restores crystal-clear sharpness to moving text.
- [ ] Add a **«Сравнение бок о бок (Side-by-Side)»** view so the user instantly sees the stark difference between Sample-and-Hold blur and BFI clarity.

---

### Task 4: Fix Module 03 (Tearing Overlay Clipping Bug)
**Files:**
- Modify: `src/components/stations/Station3ScreenTearing.tsx`
- Test: Verify zero clipping of the yellow `Задержка ввода` label behind the status badge

**Steps:**
- [ ] Remove hardcoded absolute coordinates `top-3 left-48` that caused the yellow text `ЗАДЕРЖКА ВВОДА` to be partially clipped under the V-Sync status pill.
- [ ] Redesign the top telemetry bar of the tearing canvas using clean flexbox layout (`flex items-center gap-3`) with dedicated badges for `Синхронизация`, `Время GPU`, and `Задержка ввода`.

---

### Task 5: Fix Module 04 (Physical Visual Freeze in Frame Pacing)
**Files:**
- Modify: `src/components/stations/Station4FramePacing.tsx`
- Test: Verify moving object physically hitches when microfreeze is injected

**Steps:**
- [ ] Add a smooth horizontally traversing tracker / kinetic sphere right above the oscillograph.
- [ ] When the user clicks `Инжектировать микрофриз (+58ms)`, pause the physical motion of the tracker for exactly 58ms.
- [ ] The user will immediately see the object stutter/jerk visually in real time while the oscillograph simultaneously registers the spike and 1% Low drop.

---

### Task 6: Fix Module 05 (Input Lag Crosshair Offset & Mouse Polling Rate)
**Files:**
- Modify: `src/components/stations/Station5InputLag.tsx`
- Test: Verify crosshair centers on mouse cursor and polling rate quantization is visible

**Steps:**
- [ ] Fix canvas coordinate calculation in `handlePointerMove`: calculate position using `rect.left` and `rect.top` accounting for CSS scale and scroll offsets, ensuring the reference marker is exactly under the cursor.
- [ ] Implement real sensor quantization simulation for mouse polling rates:
  - 125 Hz (Office mouse): updates pointer coordinates only every 8.0 ms, creating stair-step jagged motion during quick arcs.
  - 500 Hz: updates every 2.0 ms.
  - 1000 Hz (Esports): updates every 1.0 ms with smooth continuous path.
- [ ] Provide clear visual trail showing the delayed Jelly Cursor queue.

---

### Task 7: Redesign Module 06 (AI Frame Generation DLSS/FSR)
**Files:**
- Modify: `src/components/stations/Station6FrameGen.tsx`
- Test: Verify intuitive frame interpolation pipeline without cluttered/broken UI

**Steps:**
- [ ] Simplify and clarify the demonstration concept:
  - Base Render: 60 FPS (real GPU frames).
  - AI Generated: 120 FPS (optical flow vector interpolation inserting intermediate Frame 1.5).
- [ ] Provide clean, intuitive visual modes:
  1. `60 FPS (Native GPU)`: see the base frame rate.
  2. `120 FPS (AI Frame Gen)`: doubled smoothness via interpolated frames.
  3. `Инспекция артефактов (Artifact Inspector)`: slow-motion examination showing optical flow ghosting around high-frequency HUD elements and the latency trade-off (+12 ms input lag).
- [ ] Remove clutter, broken crosshairs, and confusing overlapping buttons.

---

### Task 8: Restore Apollo Sculpture in Module 07 (GPU Benchmark)
**Files:**
- Modify: `src/components/three/ApolloBustScene.tsx`
- Modify: `src/components/stations/Station7BenchmarkSandbox.tsx`
- Test: Verify sculpture renders with clean pedestal, no yellow dots, and scalable polygons

**Steps:**
- [ ] Re-introduce the classical marble sculpture bust in `ApolloBustScene.tsx`.
- [ ] Remove all yellow floating dots and glitchy floor reflection artifacts.
- [ ] Replace the pedestal with a clean, matte architectural column / studio plinth.
- [ ] Implement interactive polygon density / subdivision control (from 2,500 to 50,000 polygons) with Wireframe overlay toggle and dynamic Studio RGB lights, creating a true, beautiful GPU benchmark.

---

### Task 9: Full Verification & Automated Playwright Suite
**Files:**
- Modify: `verify_hertz.cjs`
- Output: Screenshots of Hero, Top Nav, Modules 2, 3, 4, 5, 6, 7
- Test: Run complete Playwright test suite and verify 0 errors
