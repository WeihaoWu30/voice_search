package com.voiceguard.controller;

import com.voiceguard.model.SearchResponse;
import com.voiceguard.service.VoiceSearchService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api")
public class VoiceSearchController {

    private final VoiceSearchService voiceSearchService;

    public VoiceSearchController(VoiceSearchService voiceSearchService) {
        this.voiceSearchService = voiceSearchService;
    }

    /**
     * POST /api/search
     * Accepts multipart form data:
     *   - audioFile: the uploaded audio file (MP3, WAV, M4A, etc.)
     *   - artistName: the VO artist's name
     *   - platforms: comma-separated list of platforms to search
     */
    @PostMapping(value = "/search", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SearchResponse> search(
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam("artistName") String artistName,
            @RequestParam(value = "platforms", defaultValue = "ElevenLabs,Weights.gg,Murf,PlayHT,Voicemod,Resemble AI")
                String platforms) throws IOException {

        if (audioFile.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        List<String> platformList = Arrays.asList(platforms.split(","));
        SearchResponse response = voiceSearchService.analyze(audioFile, artistName.trim(), platformList);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/health
     * Simple health check.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("VoiceGuard API is running");
    }
}
