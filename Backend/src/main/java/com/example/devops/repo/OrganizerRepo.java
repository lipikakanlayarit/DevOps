package com.example.devops.repo;

import com.example.devops.model.Organizer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OrganizerRepo extends JpaRepository<Organizer, Long> {

    Optional<Organizer> findByEmailIgnoreCase(String email);
    Optional<Organizer> findByUsernameIgnoreCase(String username);

    /** ✅ ใช้สำหรับ EventQueryController – คืน organizer_id จาก email หรือ username */
    @Query(value = """
        SELECT organizer_id 
        FROM organizers 
        WHERE lower(email) = lower(:key) OR lower(username) = lower(:key)
        LIMIT 1
        """, nativeQuery = true)
    Optional<Long> findIdByEmailOrUsernameIgnoreCase(@Param("key") String key);
}
