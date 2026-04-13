package com.corporate.payroll.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret:mySecretKey}")
    private String jwtSecret;

    @Value("${app.jwt.expiration:86400000}")
    private int jwtExpirationInMs;

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    public String generateToken(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        long now = System.currentTimeMillis();
        long expiryTime = now + jwtExpirationInMs;

        List<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        Map<String, Object> payload = new HashMap<>();
        payload.put("sub", user.getUsername());
        payload.put("iat", now);
        payload.put("exp", expiryTime);
        payload.put("roles", roles);
        payload.put("userId", user.getUsername());

        return generateSimpleToken(payload);
    }

    public String generateTokenFromUserDetails(String username, List<String> roles, Long userId) {
        long now = System.currentTimeMillis();
        long expiryTime = now + jwtExpirationInMs;

        Map<String, Object> payload = new HashMap<>();
        payload.put("sub", username);
        payload.put("iat", now);
        payload.put("exp", expiryTime);
        payload.put("roles", roles);
        payload.put("userId", userId);

        return generateSimpleToken(payload);
    }

    private String generateSimpleToken(Map<String, Object> payload) {
        try {
            String payloadStr = mapToJsonString(payload);
            
            String signature = calculateHMAC(payloadStr, jwtSecret);
            
            return Base64.getEncoder().encodeToString(payloadStr.getBytes(StandardCharsets.UTF_8)) + "." + 
                   Base64.getEncoder().encodeToString(signature.getBytes(StandardCharsets.UTF_8));
                   
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate token", e);
        }
    }

    private String mapToJsonString(Map<String, Object> map) {
        StringBuilder json = new StringBuilder();
        json.append("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (!first) json.append(",");
            json.append("\"").append(entry.getKey()).append("\":");
            if (entry.getValue() instanceof String) {
                json.append("\"").append(entry.getValue()).append("\"");
            } else {
                json.append(entry.getValue());
            }
            first = false;
        }
        json.append("}");
        return json.toString();
    }

    private String calculateHMAC(String data, String key) 
            throws NoSuchAlgorithmException, InvalidKeyException {
        Mac sha256_HMAC = Mac.getInstance(HMAC_ALGORITHM);
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
        sha256_HMAC.init(secret_key);
        return bytesToHex(sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

    public String getUsernameFromToken(String token) {
        try {
            Map<String, Object> payload = parseToken(token);
            return (String) payload.get("sub");
        } catch (Exception e) {
            log.error("Error extracting username from token: {}", e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        try {
            Map<String, Object> payload = parseToken(token);
            return (List<String>) payload.get("roles");
        } catch (Exception e) {
            log.error("Error extracting roles from token: {}", e.getMessage());
            return null;
        }
    }

    public Long getUserIdFromToken(String token) {
        try {
            Map<String, Object> payload = parseToken(token);
            Object userId = payload.get("userId");
            if (userId instanceof Long) {
                return (Long) userId;
            } else if (userId instanceof String) {
                return Long.parseLong((String) userId);
            }
            return null;
        } catch (Exception e) {
            log.error("Error extracting userId from token: {}", e.getMessage());
            return null;
        }
    }

    private Map<String, Object> parseToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid token format");
            }

            String payloadStr = new String(Base64.getDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            
            String expectedSignature = calculateHMAC(payloadStr, jwtSecret);
            String actualSignature = new String(Base64.getDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            
            if (!expectedSignature.equals(actualSignature)) {
                throw new IllegalArgumentException("Invalid token signature");
            }

            Map<String, Object> payload = jsonStringToMap(payloadStr);
            Long exp = (Long) payload.get("exp");
            if (exp != null && System.currentTimeMillis() > exp) {
                throw new IllegalArgumentException("Token expired");
            }

            return payload;
        } catch (Exception e) {
            log.error("Error parsing token: {}", e.getMessage());
            throw new RuntimeException("Invalid token", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonStringToMap(String jsonStr) {
        Map<String, Object> map = new HashMap<>();
        if (jsonStr.startsWith("{") && jsonStr.endsWith("}")) {
            String content = jsonStr.substring(1, jsonStr.length() - 1);
            String[] pairs = content.split(",");
            for (String pair : pairs) {
                String[] keyValue = pair.split(":", 2);
                if (keyValue.length == 2) {
                    String key = keyValue[0].trim().replace("\"", "");
                    String value = keyValue[1].trim();
                    if (value.startsWith("\"") && value.endsWith("\"")) {
                        value = value.substring(1, value.length() - 1);
                        map.put(key, value);
                    } else {
                        try {
                            if (value.contains(".")) {
                                map.put(key, Double.parseDouble(value));
                            } else {
                                map.put(key, Long.parseLong(value));
                            }
                        } catch (NumberFormatException e) {
                            map.put(key, value);
                        }
                    }
                }
            }
        }
        return map;
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    public UsernamePasswordAuthenticationToken getAuthentication(String token) {
        try {
            String username = getUsernameFromToken(token);
            List<String> roles = getRolesFromToken(token);
            
            if (username != null && roles != null) {
                org.springframework.security.core.userdetails.User principal = 
                    new org.springframework.security.core.userdetails.User(username, "", 
                        roles.stream()
                            .map(role -> new SimpleGrantedAuthority(role))
                            .collect(Collectors.toList()));
                
                return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
            }
            return null;
        } catch (Exception e) {
            log.error("Error creating authentication from token: {}", e.getMessage());
            return null;
        }
    }
}
