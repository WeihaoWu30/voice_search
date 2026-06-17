package com.voiceguard.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VoiceProfile {
    private String pitch;         // e.g. "Mid-range baritone"
    private String tone;          // e.g. "Warm, resonant"
    private String accent;        // e.g. "General American"
    private String pacing;        // e.g. "Measured, deliberate"
    private String distinctiveTraits; // e.g. "Slight vocal fry on low notes"
    private String summary;       // Full paragraph description
}
