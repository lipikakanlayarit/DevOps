package com.example.devops.test.support;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * ใช้เคลียร์ข้อมูลทุกตารางแบบ TRUNCATE CASCADE
 * ป้องกันปัญหา FK ค้างระหว่างเทสต์
 */
@Component
public class DbCleaner {

    private final JdbcTemplate jdbc;

    public DbCleaner(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void truncateAll() {
        jdbc.execute("""
            DO $$
            DECLARE
                r RECORD;
            BEGIN
              FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
              END LOOP;
            END $$;
        """);
    }
}
