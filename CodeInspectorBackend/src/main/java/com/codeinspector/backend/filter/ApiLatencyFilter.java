package com.codeinspector.backend.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicLong;

@Component
@WebFilter(urlPatterns = "/*")
public class ApiLatencyFilter implements Filter {

    // Yorum: Basit ortalama için toplam süre ve istek sayısı
    private final AtomicLong totalMs = new AtomicLong(0);
    private final AtomicLong count = new AtomicLong(0);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        long start = System.nanoTime();
        try {
            chain.doFilter(request, response);
        } finally {
            long elapsedMs = (System.nanoTime() - start) / 1_000_000;
            totalMs.addAndGet(elapsedMs);
            count.incrementAndGet();
        }
    }

    public long getAverageMs() {
        long c = count.get();
        return c == 0 ? 0 : totalMs.get() / c;
    }
}


