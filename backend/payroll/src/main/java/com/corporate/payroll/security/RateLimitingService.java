package com.corporate.payroll.security;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class RateLimitingService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_TIME_DURATION = 15 * 60 * 1000; // 15 minutes

    private final ConcurrentHashMap<String, AtomicInteger> attemptsCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lockTimeCache = new ConcurrentHashMap<>();

    public boolean isLocked(String email) {
        Long lockTime = lockTimeCache.get(email);
        if (lockTime == null) {
            return false;
        }

        if (System.currentTimeMillis() - lockTime > LOCK_TIME_DURATION) {
            unlock(email);
            return false;
        }

        return true;
    }

    public void recordFailedAttempt(String email) {
        AtomicInteger attempts = attemptsCache.computeIfAbsent(email, k -> new AtomicInteger(0));
        int currentAttempts = attempts.incrementAndGet();

        if (currentAttempts >= MAX_ATTEMPTS) {
            lock(email);
        }
    }

    public void recordSuccessfulAttempt(String email) {
        unlock(email);
    }

    private void lock(String email) {
        lockTimeCache.put(email, System.currentTimeMillis());
    }

    private void unlock(String email) {
        attemptsCache.remove(email);
        lockTimeCache.remove(email);
    }

    public int getRemainingAttempts(String email) {
        if (isLocked(email)) {
            return 0;
        }
        AtomicInteger attempts = attemptsCache.get(email);
        return attempts == null ? MAX_ATTEMPTS : Math.max(0, MAX_ATTEMPTS - attempts.get());
    }

    public long getLockTimeRemaining(String email) {
        Long lockTime = lockTimeCache.get(email);
        if (lockTime == null) {
            return 0;
        }
        return Math.max(0, LOCK_TIME_DURATION - (System.currentTimeMillis() - lockTime));
    }
}
