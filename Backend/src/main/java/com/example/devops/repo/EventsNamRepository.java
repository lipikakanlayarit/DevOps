
package com.example.devops.repo;

import com.example.devops.model.EventsNam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface EventsNamRepository extends JpaRepository<EventsNam, Long> {

    @Query(value = "SELECT event_name FROM events_nam WHERE id = ?1", nativeQuery = true)
    String findEventNameByIdNative(Long id);
}
