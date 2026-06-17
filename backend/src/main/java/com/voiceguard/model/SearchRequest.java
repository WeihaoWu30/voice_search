package com.voiceguard.model;

import lombok.Data;
import java.util.List;

@Data
public class SearchRequest {
    private String artistName;
    private List<String> platforms; // platforms to search
}
