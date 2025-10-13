
package com.example.devops.repo;

import com.example.devops.model.User;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsernameIgnoreCase(String username);
    Optional<User> findByEmailIgnoreCase(String email);

    @Query(value = "SELECT user_id FROM users WHERE lower(username) = lower(?1) LIMIT 1", nativeQuery = true)
    Long findUserIdByUsernameIgnoreCaseNative(String username);

    @Query(value = "SELECT user_id FROM users WHERE lower(email) = lower(?1) LIMIT 1", nativeQuery = true)
    Long findUserIdByEmailIgnoreCaseNative(String email);
}
