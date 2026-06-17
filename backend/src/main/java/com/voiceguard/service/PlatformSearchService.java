package com.voiceguard.service;

import com.voiceguard.model.PlatformResult;
import com.voiceguard.model.VoiceProfile;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Generates search URLs for known AI voice platforms.
 *
 * NOTE: Most AI voice platforms (ElevenLabs, Murf, etc.) do not expose public
 * search APIs for voice lookup. This service builds direct search URLs that
 * users can follow, and applies heuristic risk scoring based on platform
 * characteristics and voice profile data.
 *
 * A production-grade version would integrate with platform APIs as they
 * become available, and/or use audio fingerprinting services (e.g. ACRCloud).
 */
@Service
public class PlatformSearchService {

    private static final Map<String, String> PLATFORM_BASE_URLS = Map.of(
        "ElevenLabs",  "https://elevenlabs.io/app/voice-library?search=",
        "Murf",        "https://murf.ai/voice-library?query=",
        "PlayHT",      "https://play.ht/voices?search=",
        "Weights.gg",  "https://weights.gg/models?search=",
        "Voicemod",    "https://www.voicemod.net/voice-changer/?q=",
        "Resemble AI", "https://www.resemble.ai/voices?q="
    );

    /**
     * For each requested platform, build a search URL using the artist name
     * and voice characteristics, and assign a preliminary risk level.
     */
    public List<PlatformResult> searchPlatforms(String artistName,
                                                 VoiceProfile profile,
                                                 List<String> requestedPlatforms) {
        List<PlatformResult> results = new ArrayList<>();
        String encodedName = URLEncoder.encode(artistName, StandardCharsets.UTF_8);

        for (String platform : requestedPlatforms) {
            String baseUrl = PLATFORM_BASE_URLS.getOrDefault(platform,
                "https://www.google.com/search?q=site:" + platform.toLowerCase().replace(" ", "") + ".com+");

            String searchUrl = baseUrl + encodedName;

            // Heuristic risk scoring:
            // ElevenLabs and Weights.gg are the most common platforms for unauthorized
            // voice clones due to their open voice libraries.
            PlatformResult result = buildPlatformResult(platform, artistName, searchUrl, profile);
            results.add(result);
        }

        return results;
    }

    private PlatformResult buildPlatformResult(String platform, String artistName,
                                                String searchUrl, VoiceProfile profile) {
        // High-risk platforms (large open voice libraries)
        boolean isHighRiskPlatform = List.of("ElevenLabs", "Weights.gg", "PlayHT").contains(platform);

        // Voices with distinctive traits are more likely to be identifiable clones
        boolean hasDistinctiveVoice = profile.getDistinctiveTraits() != null
            && !profile.getDistinctiveTraits().isBlank()
            && !profile.getDistinctiveTraits().contains("Unable");

        String status;
        String details;
        int matchCount;

        if (isHighRiskPlatform && hasDistinctiveVoice) {
            status = "CAUTION";
            details = "High-traffic platform with open voice library. Manually verify search results for '" + artistName + "'.";
            matchCount = 0; // actual count requires API access
        } else if (isHighRiskPlatform) {
            status = "CAUTION";
            details = "Platform hosts many community-submitted voices. Review search results carefully.";
            matchCount = 0;
        } else {
            status = "CLEAR";
            details = "No automated matches detected. Manual review recommended for thoroughness.";
            matchCount = 0;
        }

        return PlatformResult.builder()
            .platform(platform)
            .status(status)
            .details(details)
            .searchUrl(searchUrl)
            .matchCount(matchCount)
            .build();
    }
}
