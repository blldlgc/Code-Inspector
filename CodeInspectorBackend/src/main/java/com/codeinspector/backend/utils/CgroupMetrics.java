package com.codeinspector.backend.utils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicLong;

public final class CgroupMetrics {

    // Yorum: CPU kullanımını hesaplamak için son ölçüm değerlerini saklarız
    private static final AtomicLong lastCpuUsageUsec = new AtomicLong(-1);
    private static final AtomicLong lastCpuTimestampNs = new AtomicLong(-1);

    private CgroupMetrics() {}

    // Yorum: Dosyadan tek satır string okur
    private static String readFirstLine(Path path) throws IOException {
        return Files.readAllLines(path).get(0).trim();
    }

    // Yorum: Cgroup v2 için memory.current ve memory.max üzerinden bellek kullanım yüzdesi
    // Cgroup v1 varsa memory/usage_in_bytes ve memory/limit_in_bytes kullanılır
    public static double getMemoryUsagePercent() {
        try {
            // cgroup v2
            Path memCurrent = Paths.get("/sys/fs/cgroup/memory.current");
            Path memMax = Paths.get("/sys/fs/cgroup/memory.max");
            if (Files.exists(memCurrent) && Files.exists(memMax)) {
                long current = Long.parseLong(readFirstLine(memCurrent));
                String maxStr = readFirstLine(memMax);
                long max = "max".equals(maxStr) ? getHostTotalMemoryApprox() : Long.parseLong(maxStr);
                if (max > 0) {
                    return Math.min(100.0, (current * 100.0) / max);
                }
            }

            // cgroup v1 fallback
            Path v1Usage = Paths.get("/sys/fs/cgroup/memory/memory.usage_in_bytes");
            Path v1Limit = Paths.get("/sys/fs/cgroup/memory/memory.limit_in_bytes");
            if (Files.exists(v1Usage) && Files.exists(v1Limit)) {
                long current = Long.parseLong(readFirstLine(v1Usage));
                long max = Long.parseLong(readFirstLine(v1Limit));
                if (max > 0) {
                    return Math.min(100.0, (current * 100.0) / max);
                }
            }
        } catch (Exception ignored) {
            // Yorum: Herhangi bir hata durumunda aşağıdaki host tahminine düşer
        }

        // Yorum: JVM heap üzerinden yaklaşık bellek kullanımı (fallback)
        long used = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
        long max = Runtime.getRuntime().maxMemory();
        if (max > 0) {
            return Math.min(100.0, (used * 100.0) / max);
        }
        return 0.0;
    }

    // Yorum: Cgroup v2 cpu.stat usage_usec ile CPU yüzdesi (delta bazlı).
    // İlk çağrıda ölçüm olmadığı için -1 döner; sonraki çağrılarda yaklaşık değer verir.
    public static double getCpuUsagePercent() {
        try {
            Path cpuStat = Paths.get("/sys/fs/cgroup/cpu.stat");
            if (Files.exists(cpuStat)) {
                // Yorum: usage_usec satırını bul
                for (String line : Files.readAllLines(cpuStat)) {
                    if (line.startsWith("usage_usec ")) {
                        long usageUsec = Long.parseLong(line.split(" ")[1]);
                        long nowNs = System.nanoTime();

                        long lastUsage = lastCpuUsageUsec.getAndSet(usageUsec);
                        long lastTs = lastCpuTimestampNs.getAndSet(nowNs);

                        if (lastUsage < 0 || lastTs < 0) {
                            return -1.0; // Yorum: İlk ölçüm, karşılaştırma yok
                        }

                        long deltaUsec = usageUsec - lastUsage; // Yorum: Mikro-saniye
                        long deltaNs = Math.max(1, nowNs - lastTs); // Yorum: Nano-saniye

                        // Yorum: Tek CPU varsayımıyla yüzde; çok çekirdekte üst limit >100 olabilir
                        double cpuPercent = (deltaUsec * 100.0) / (deltaNs / 1000.0);
                        return Math.max(0.0, Math.min(cpuPercent, 100.0 * getAvailableCpuCores()));
                    }
                }
            }
        } catch (Exception ignored) {
        }

        // Yorum: Fallback: system load average üzerinden yaklaşık
        double load = java.lang.management.ManagementFactory.getOperatingSystemMXBean().getSystemLoadAverage();
        int cores = getAvailableCpuCores();
        if (load >= 0 && cores > 0) {
            return Math.min(100.0, (load * 100.0) / cores);
        }
        return 0.0;
    }

    // Yorum: Disk kullanımını root dosya sistemi üzerinden hesaplar
    public static double getDiskUsagePercent() {
        try {
            File root = new File("/");
            long total = root.getTotalSpace();
            long free = root.getUsableSpace();
            long used = Math.max(0, total - free);
            if (total > 0) {
                return (used * 100.0) / total;
            }
        } catch (Exception ignored) {
        }
        return 0.0;
    }

    // Yorum: Mevcut CPU çekirdek sayısını döndürür
    private static int getAvailableCpuCores() {
        int cores = Runtime.getRuntime().availableProcessors();
        return Math.max(1, cores);
    }

    // Yorum: Host toplam belleği için kaba tahmin (fallback)
    private static long getHostTotalMemoryApprox() {
        try {
            for (String line : Files.readAllLines(Paths.get("/proc/meminfo"))) {
                if (line.startsWith("MemTotal:")) {
                    String[] parts = line.split("\\s+");
                    long kB = Long.parseLong(parts[1]);
                    return kB * 1024L;
                }
            }
        } catch (Exception ignored) {
        }
        // Yorum: JVM max memory fallback
        return Runtime.getRuntime().maxMemory();
    }
}


