package com.voiceguard.service;

import com.voiceguard.model.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class VoiceSearchService {

    private final ClaudeService claudeService;
    private final PlatformSearchService platformSearchService;

    public VoiceSearchService(ClaudeService claudeService, PlatformSearchService platformSearchService) {
        this.claudeService = claudeService;
        this.platformSearchService = platformSearchService;
    }

    public SearchResponse analyze(MultipartFile audioFile, String artistName, List<String> platforms) throws IOException {
        // 1. Analyze voice with Claude
        String mimeType = resolveMimeType(audioFile.getOriginalFilename());
        VoiceProfile voiceProfile = claudeService.analyzeAudio(audioFile.getBytes(), mimeType, artistName);

        // 2. Search platforms
        List<PlatformResult> platformResults = platformSearchService.searchPlatforms(artistName, voiceProfile, platforms);

        // 3. Compute risk level
        long flaggedCount = platformResults.stream().filter(r -> "FLAGGED".equals(r.getStatus())).count();
        long cautionCount = platformResults.stream().filter(r -> "CAUTION".equals(r.getStatus())).count();

        String riskLevel;
        if (flaggedCount > 0) {
            riskLevel = "HIGH";
        } else if (cautionCount >= 2) {
            riskLevel = "MEDIUM";
        } else {
            riskLevel = "LOW";
        }

        // 4. Generate risk summary via Claude
        String riskSummary = claudeService.generateRiskSummary(
            artistName, voiceProfile, (int)(flaggedCount + cautionCount), platforms.size()
        );

        // 5. Recommended actions
        List<String> recommendedActions = buildRecommendedActions(riskLevel, artistName);

        return SearchResponse.builder()
            .artistName(artistName)
            .voiceProfile(voiceProfile)
            .riskLevel(riskLevel)
            .riskSummary(riskSummary)
            .platformResults(platformResults)
            .recommendedActions(recommendedActions)
            .build();
    }

    private String resolveMimeType(String filename) {
        if (filename == null) return "audio/mpeg";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".mp3"))  return "audio/mpeg";
        if (lower.endsWith(".wav"))  return "audio/wav";
        if (lower.endsWith(".m4a"))  return "audio/mp4";
        if (lower.endsWith(".ogg"))  return "audio/ogg";
        if (lower.endsWith(".flac")) return "audio/flac";
        return "audio/mpeg";
    }

    private List<String> buildRecommendedActions(String riskLevel, String artistName) {
        return switch (riskLevel) {
            case "HIGH" -> List.of(
                "File a DMCA takedown immediately for confirmed matches",
                "Contact an entertainment attorney specializing in AI/IP law",
                "Submit a report to NAVA (navavoices.org)",
                "Document all evidence with screenshots and timestamps",
                "Review the NO FAKES Act resources at navavoices.org"
            );
            case "MEDIUM" -> List.of(
                "Manually verify flagged platforms using the search links provided",
                "Consider filing preemptive DMCA notices on suspicious listings",
                "Register your voice likeness with NAVA's AI Rider",
                "Monitor platforms monthly using this tool"
            );
            default -> List.of(
                "No immediate action required, but monitor regularly",
                "Register your voice with NAVA's AI Rider as a precaution",
                "Learn about your rights under the NO FAKES Act (navavoices.org)",
                "Set a monthly reminder to re-run this scan"
            );
        };
    }
}
