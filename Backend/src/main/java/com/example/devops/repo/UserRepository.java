package com.example.devops.repo;

import com.example.devops.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);

@Query("select u from User u where lower(u.username)=lower(:identifier) or lower(u.email)=lower(:identifier)")
java.util.Optional<User> findByIdentifier(@Param("identifier") String identifier);

}