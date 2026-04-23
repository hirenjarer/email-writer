package com.email.writer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;
    private final String apiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder,
                                 @Value("${gemini.api.url}") String baseURL,
                                 @Value("${gemini.api.key}") String geminiApiKey) {
        this.apiKey = geminiApiKey;

        this.webClient = webClientBuilder
                .baseUrl(baseURL)
                .build();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        // Build prompt
        String prompt = buildPrompt(emailRequest);

        // Prepare row JSON body
        String requestBody = String.format("""
                        {
                            "contents": [
                              {
                                "parts": [
                                  {
                                    "text": "%s"
                                  }
                                ]
                              }
                            ]
                          }
                """, prompt);

        // Send request
        String response = webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1beta/models/gemini-3-flash-preview:generateContent")
                        .build())
                .header("x-goog-api-key", apiKey)
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        // Extract Response
        return extractResponse(response);
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Generate a email reply (only one, not options or many and without subject - direct reply) for the following email : ");

        if (emailRequest.getTone() != null && !emailRequest.getTone().isBlank()) {
            prompt.append("Use a ").append(emailRequest.getTone()).append(" tone.");
        }
        prompt.append("Original Email : \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }

    private String extractResponse(String response) {

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            return root.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (JacksonException e) {
            throw new RuntimeException(e);
        }
    }
}
