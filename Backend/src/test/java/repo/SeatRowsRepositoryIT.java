package com.example.devops.repo;

import com.example.devops.model.SeatRows;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource("classpath:application-test.properties")
@Sql(scripts = {"/schema_seat_rows_test.sql", "/data_seat_rows_test.sql"})
class SeatRowsRepositoryIT {

    @Autowired
    SeatRowsRepository repo;

    @Test
    void testFindAllRowsByEventId() {
        List<SeatRows> rows = repo.findAllRowsByEventId(100L);

        assertThat(rows).hasSize(3); // Zone 10: A,B and Zone 11: C
        assertThat(rows.get(0).getRowLabel()).isEqualTo("A"); // sort_order ascending
    }

    @Test
    void testCountByZoneId() {
        int count = repo.countByZoneId(10L);
        assertThat(count).isEqualTo(2); // rows: A, B
    }

    @Test
    void testDeleteByEventId() {
        repo.deleteByEventId(100L);

        // After delete, only zone 20 (event 200) should remain
        int remaining = repo.countByZoneId(20L);
        assertThat(remaining).isEqualTo(1);

        // others must be deleted
        assertThat(repo.countByZoneId(10L)).isEqualTo(0);
        assertThat(repo.countByZoneId(11L)).isEqualTo(0);
    }

    @Test
    void testSaveNewRow() {
        SeatRows row = new SeatRows();
        row.setZoneId(10L);
        row.setRowLabel("Z");
        row.setSortOrder(5);
        row.setIsActive(true);

        SeatRows saved = repo.save(row);

        assertThat(saved.getRowId()).isNotNull();

        int count = repo.countByZoneId(10L);
        assertThat(count).isEqualTo(3);
    }
}

