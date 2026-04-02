# Video Director Skill

I am adding a skill to your directory to help you manage cinematic timing and asset handoffs for video rendering.

## Standardized Capability: Media Management

This skill provides a standardized framework for managing video assets, timing, and frame rates for high-fidelity marketing videos, ensuring every website launch feels premium and cinematic.

### Cinematic Timing
- **Standard Frame Rates**: 24fps (Cinematic), 30fps (Broadcast), or 60fps (High Fluidity).
- **Pacing**: Ensure timing aligns with key marketing messages and UI transitions.
- **Micro-Animations**: All UI interactions should have a 300ms-500ms lead-in/lead-out for visual polish.

### Asset Management
- **Asset Paths**: Use standardized directories for media assets (e.g., `public/assets/videos`, `public/assets/branding`).
- **Handoffs**: Automatically verify asset availability before initiating video generation tasks (like Remotion).
- **Naming Conventions**: `[project]_[screen]_[timestamp]_[version].mp4`

### Directives for Agentic Memory
- Always check for the presence of high-fidelity assets before suggesting a video launch.
- Pre-plan cinematic sequences using the `composition-checklist.md` if available in the Remotion skill.
- Maintain a log of timing cues for final rendering consistency.
