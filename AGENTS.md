# NC.edu Agent Instructions & Persistent Guidelines

This file is loaded automatically by the system to guide future sessions and ensure continuity in the development and maintenance of the application.

## 🚀 Persistent Guidelines

### 1. Daily Practical Simulations Goal
* **Instruction**: Every day (or in each major iteration cycle), the AI coding assistant must upgrade **at least 5 practical experiments** from the generic `'unified_bench'` simulator to fully customized, interactive, and subject-specific simulated boards.
* **Current Status**: All 80 GCE syllabus experiments (20 per subject) are registered in `src/data/practicalsData.ts`. You should incrementally replace the `'unified_bench'` simulator type with dedicated simulation designs and views.
* **Next target list for upgrading**:
  1. **Chemistry**: Reaction Rate of Sodium Thiosulfate & HCl
  2. **Chemistry**: Enthalpy of Neutralization (Calorimetry)
  3. **Physics**: Speed of Sound using Resonance Tube
  4. **Physics**: Hooke's Law & Spring Constant
  5. **Biology**: Amylase Enzyme Rate vs Temperature

### 2. UI/UX Consistency
* Ensure any interactive elements added adhere strictly to the clean, modern aesthetic of NC.edu.
* Respect the newly implemented **Hamburger Menu / Drawer** navigation in the Student Dashboard to keep the UI clean and spacious.
