package com.example.devops.config;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;

import java.io.InputStream;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@Profile("dev") // รันเฉพาะ dev
@RequiredArgsConstructor
public class ImageSeeder implements CommandLineRunner {

    private final EventsNamRepository eventsRepo;

    @Value("${app.seed.images:true}") // เปิด/ปิด seeder ด้วย flag
    private boolean enableSeeding;

    @Override
    public void run(String... args) {
        if (!enableSeeding) {
            log.info("ImageSeeder disabled (app.seed.images=false)");
            return;
        }

        Map<String, String> targets = new LinkedHashMap<>();
        targets.put("BUTCON Music Fest 2025", "pic_seed/seed1");
        targets.put("Startup Seminar 2025",  "pic_seed/seed2");

        targets.forEach(this::seedCoverIfMissingSmart);
    }

    /** พยายามเปิดไฟล์หลายแบบ: ไม่มีนามสกุล, .jpeg, .jpg, .png และกำหนด mime ให้เหมาะ */
    private void seedCoverIfMissingSmart(String eventName, String baseClasspath) {
        try {
            Optional<EventsNam> opt = eventsRepo.findTopByEventNameOrderByIdDesc(eventName);
            if (opt.isEmpty()) {
                log.warn("ImageSeeder: event not found: {}", eventName);
                return;
            }
            EventsNam e = opt.get();

            if (e.getCover_image() != null && e.getCover_image().length > 0) {
                log.info("ImageSeeder: skip \"{}\" (id={}) existing cover bytes={}",
                        e.getEventName(), e.getId(), e.getCover_image().length);
                return;
            }

            String[] candidates = new String[] {
                    baseClasspath,
                    baseClasspath + ".jpeg",
                    baseClasspath + ".jpg",
                    baseClasspath + ".png"
            };

            byte[] bytes = null;
            String chosenPath = null;
            String mime = null;

            for (String c : candidates) {
                byte[] b = readAllBytesFromClasspath(c);
                if (b != null && b.length > 0) {
                    bytes = b;
                    chosenPath = c;
                    mime = c.endsWith(".png") ? "image/png" : "image/jpeg";
                    break;
                }
            }

            if (bytes == null) {
                log.warn("ImageSeeder: resource not found for {} (tried no-ext/.jpeg/.jpg/.png)", baseClasspath);
                return;
            }

            e.setCover_image(bytes);
            e.setCover_image_type(mime);
            e.setCover_updated_at(Instant.now());
            eventsRepo.save(e);

            log.info("ImageSeeder: seeded cover for \"{}\" from {} (id={}) bytes={} type={}",
                    e.getEventName(), chosenPath, e.getId(), bytes.length, mime);

        } catch (Exception ex) {
            log.error("ImageSeeder error for \"{}\": {}", eventName, ex.getMessage(), ex);
        }
    }

    private byte[] readAllBytesFromClasspath(String classpathLocation) {
        try {
            ClassPathResource res = new ClassPathResource(classpathLocation);
            if (!res.exists()) return null;
            try (InputStream in = res.getInputStream()) {
                return in.readAllBytes();
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
