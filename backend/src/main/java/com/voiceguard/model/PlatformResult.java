package com.voiceguard.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlatformResult {
    private String platform;      // e.g. "ElevenLabs"
    private String status;        // "FLAGGED", "CAUTION", "CLEAR"
    private String details;       // Human-readable finding
    private String searchUrl;     // Direct link to search on platform
    private int matchCount;       // Estimated number of matches
}
