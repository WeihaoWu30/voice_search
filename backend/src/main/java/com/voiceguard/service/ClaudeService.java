package com.voiceguard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voiceguard.model.VoiceProfile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
public class ClaudeService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${anthropic.api.key}")
    private String apiKey;

    @Value("${anthropic.model}")
    private String model;

    public ClaudeService(WebClient.Builder webClientBuilder,
                         @Value("${anthropic.api.url}") String apiUrl,
                         ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.objectMapper = objectMapper;
    }

    /**
     * Analyzes an audio file and returns a structured voice profile.
     * The audio bytes are base64-encoded and sent to Claude as a document.
     */
    public VoiceProfile analyzeAudio(byte[] audioBytes, String mimeType, String artistName) {
        String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

        String prompt = """
            You are analyzing an audio file for a voice likeness protection tool used by voice-over artists.
            
            Artist name: %s
            
            Listen carefully to the audio and describe the voice with the following JSON structure:
            {
              "pitch": "<pitch range, e.g. 'Deep baritone', 'High soprano', 'Mid-range tenor'>",
              "tone": "<tonal quality, e.g. 'Warm and resonant', 'Bright and crisp', 'Husky'>",
              "accent": "<accent/dialect, e.g. 'General American', 'British RP', 'Southern American'>",
              "pacing": "<speaking pace and rhythm, e.g. 'Fast and energetic', 'Slow and deliberate'>",
              "distinctiveTraits": "<any unique vocal characteristics>",
              "summary": "<2-3 sentence paragraph describing the overall voice in detail>"
            }
            
            Respond ONLY with valid JSON. No markdown, no explanation.
            """.formatted(artistName);

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", 1024,
            "messages", List.of(
                Map.of(
                    "role", "user",
                    "content", List.of(
                        Map.of(
                            "type", "document",
                            "source", Map.of(
                                "type", "base64",
                                "media_type", mimeType,
                                "data", base64Audio
                            )
                        ),
                        Map.of("type", "text", "text", prompt)
                    )
                )
            )
        );

        try {
            String response = webClient.post()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .header("anthropic-version", "2023-06-01")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(response);
            String content = root.path("content").get(0).path("text").asText();
            JsonNode profileJson = objectMapper.readTree(content);

            return VoiceProfile.builder()
                .pitch(profileJson.path("pitch").asText())
                .tone(profileJson.path("tone").asText())
                .accent(profileJson.path("accent").asText())
                .pacing(profileJson.path("pacing").asText())
                .distinctiveTraits(profileJson.path("distinctiveTraits").asText())
                .summary(profileJson.path("summary").asText())
                .build();

        } catch (Exception e) {
            // Fallback profile if Claude can't process
            return VoiceProfile.builder()
                .pitch("Unable to analyze")
                .tone("Unable to analyze")
                .accent("Unable to analyze")
                .pacing("Unable to analyze")
                .distinctiveTraits("Audio analysis failed: " + e.getMessage())
                .summary("Voice analysis could not be completed. Please ensure the audio file is clear and in a supported format.")
                .build();
        }
    }

    /**
     * Uses Claude to generate a natural-language risk assessment
     * based on the voice profile and platform findings.
     */
    public String generateRiskSummary(String artistName, VoiceProfile profile, int flaggedCount, int totalPlatforms) {
        String prompt = """
            A voice-over artist named %s has used our tool to check if their voice is being used without authorization on AI voice platforms.
            
            Voice profile:
            - Pitch: %s
            - Tone: %s
            - Distinctive traits: %s
            
            Search results: %d out of %d platforms showed potential matches.
            
            Write a 2-sentence risk assessment summary for the artist. Be direct and actionable.
            Respond with plain text only, no JSON.
            """.formatted(artistName, profile.getPitch(), profile.getTone(),
                         profile.getDistinctiveTraits(), flaggedCount, totalPlatforms);

        Map<String, Object> requestBody = Map.of(
            "model", model,
            "max_tokens", 256,
            "messages", List.of(
                Map.of("role", "user", "content", prompt)
            )
        );

        try {
            String response = webClient.post()
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .header("anthropic-version", "2023-06-01")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            JsonNode root = objectMapper.readTree(response);
            return root.path("content").get(0).path("text").asText();

        } catch (Exception e) {
            return "Risk assessment could not be generated. Please review platform results manually.";
        }
    }
}
