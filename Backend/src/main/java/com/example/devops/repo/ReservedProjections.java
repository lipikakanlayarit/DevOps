
package com.example.devops.repo;

import java.math.BigDecimal;

public interface ReservedProjections {
    interface ReservedRow {
        Long getReservedId();
        Long getEventId();
        Integer getQuantity();
        BigDecimal getTotalAmount();
        String getPaymentStatus();
        String getConfirmationCode();
    }
}
