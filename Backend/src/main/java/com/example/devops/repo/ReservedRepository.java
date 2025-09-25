package com.example.devops.repo;

import com.example.devops.model.Reserved;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservedRepository extends JpaRepository<Reserved, Long> {
}
