
// package com.example.devops.config;

// import com.example.devops.model.User;
// import org.springframework.context.annotation.Profile;
// import com.example.devops.repo.UserRepository;
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.security.crypto.password.PasswordEncoder;

// @Configuration
// public @Profile("seed")
// public class DataInitializer {

//     private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

//     @Bean
//     CommandLineRunner seedUsers(UserRepository repo, PasswordEncoder encoder) {
//         return args -> {
//             if (repo.count() == 0) {
//                 User admin = new User();
//                 admin.setUsername("admin");
//                 admin.setPassword(encoder.encode("1234"));
//                 admin.setRole("ADMIN");
//                 repo.save(admin);

//                 User organizer = new User();
//                 organizer.setUsername("organizer");
//                 organizer.setPassword(encoder.encode("1234"));
//                 organizer.setRole("ORGANIZER");
//                 repo.save(organizer);

//                 User user = new User();
//                 user.setUsername("user");
//                 user.setPassword(encoder.encode("1234"));
//                 user.setRole("USER");
//                 repo.save(user);

//                 log.info("Seeded default users: admin/1234, organizer/1234, user/1234");
//             }
//         };
//     }
// }

package com.example.devops.config;

/**
 * No-op initializer to disable any seeding logic.
 * Replaces previous implementation that caused "repeated modifier" during build.
 */
public final class DataInitializer {
    // intentionally empty
}
