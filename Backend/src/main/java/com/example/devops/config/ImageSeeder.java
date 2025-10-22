package com.example.devops.config;

import com.example.devops.model.EventsNam;
import com.example.devops.repo.EventsNamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ImageSeeder implements CommandLineRunner {

    private final EventsNamRepository eventsRepo;

    @Override
    public void run(String... args) {
        // map: eventName -> basePath (ไม่ต้องใส่นามสกุลก็ได้)
        Map<String, String> targets = new LinkedHashMap<>();
        targets.put("BUTCON Music Fest 2025", "pic_seed/seed1");
        targets.put("Startup Seminar 2025",  "pic_seed/seed2");

        for (Map.Entry<String, String> e : targets.entrySet()) {
            seedCoverIfMissingSmart(e.getKey(), e.getValue());
        }
    }

    /** พยายามเปิดไฟล์หลายแบบ: ไม่มีนามสกุล, .jpeg, .jpg, .png และกำหนด mime ให้เหมาะ */
    private void seedCoverIfMissingSmart(String eventName, String baseClasspath) {
        try {
            Optional<EventsNam> opt = eventsRepo.findTopByEventNameOrderByIdDesc(eventName);
            if (opt.isEmpty()) {
                System.out.println("ℹ️  ImageSeeder: Event not found: " + eventName);
                return;
            }
            EventsNam e = opt.get();
            if (e.getCover_image() != null && e.getCover_image().length > 0) {
                System.out.println(" ImageSeeder: cover already exists for \"" + eventName + "\" (id=" + e.getId() + ")");
                return;
            }

            // ลองหาไฟล์ตามลำดับ
            String[] candidates = new String[] {
                    baseClasspath,              // ex: pic_seed/seed2
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
                    if (c.endsWith(".png")) mime = "image/png";
                    else mime = "image/jpeg"; // defult เป็น jpeg
                    break;
                }
            }

            if (bytes == null) {
                System.out.println(" ImageSeeder: resource not found for any candidate: " + baseClasspath + " (tried no-ext/.jpeg/.jpg/.png)");
                return;
            }

            e.setCover_image(bytes);
            e.setCover_image_type(mime);
            e.setCover_updated_at(Instant.now());
            eventsRepo.save(e);
            System.out.println(" ImageSeeder: seeded cover for \"" + eventName + "\" from " + chosenPath + " (id=" + e.getId() + ")");
        } catch (Exception ex) {
            System.out.println(" ImageSeeder error for \"" + eventName + "\": " + ex.getMessage());
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
