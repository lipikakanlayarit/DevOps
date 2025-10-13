
package com.example.devops.repo;

import java.math.BigDecimal;

public interface SeatingProjections {

    interface ZoneRow {
        Long getZoneId();
        String getZoneName();
    }

    interface RowRow {
        Long getRowId();
        String getRowLabel();
    }

    interface SeatRow {
        Long getSeatId();
        String getSeatLabel();
        Integer getSeatNumber();
    }
}
