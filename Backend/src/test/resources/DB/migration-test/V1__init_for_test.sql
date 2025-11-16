CREATE TABLE seat_zones (
                            zone_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                            event_id BIGINT
);

CREATE TABLE seat_rows (
                           row_id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           zone_id BIGINT,
                           row_label VARCHAR(50),
                           sort_order INT,
                           is_active BOOLEAN,
                           created_at TIMESTAMP,
                           updated_at TIMESTAMP
);
