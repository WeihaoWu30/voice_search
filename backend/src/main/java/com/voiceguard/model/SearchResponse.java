package com.voiceguard.model;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SearchResponse {
    private String artistName;
    private VoiceProfile voiceProfile;
    private String riskLevel;           // "HIGH", "MEDIUM", "LOW"
    private String riskSummary;
    private List<PlatformResult> platformResults;
    private List<String> recommendedActions;
}
