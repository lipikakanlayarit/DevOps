INSERT INTO events_nam(event_id,event_name,venue_name,start_datetime,sales_end_datetime)
VALUES (
           100,
           'Event A',
           'Hall A',
           CURRENT_TIMESTAMP,
           DATEADD('HOUR', 1, CURRENT_TIMESTAMP)
       );

INSERT INTO users(user_id,username,email)
VALUES (50,'alice','alice@mail.com');

INSERT INTO reserved(
    reserved_id, user_id, event_id, ticket_type_id,
    quantity, total_amount, payment_status,
    registration_datetime, payment_datetime,
    confirmation_code, notes, payment_method,
    guest_email, guest_claimed_at, created_as_guest
)
VALUES
    (1, 50, 100, NULL,
     1, 500.00, 'PAID',
     CURRENT_TIMESTAMP, NULL,
     'CONF-111', NULL, 'Credit Card',
     NULL, NULL, FALSE),

    (2, NULL, 100, NULL,
     1, 300.00, 'UNPAID',
     CURRENT_TIMESTAMP, NULL,
     'CONF-222', NULL, 'Bank Transfer',
     NULL, NULL, FALSE),

    (3, NULL, 100, NULL,
     1, 400.00, 'UNPAID',
     CURRENT_TIMESTAMP, NULL,
     'CONF-333', NULL, 'QR Payment',
     'guest@mail.com', NULL, TRUE);


INSERT INTO seat_zones(zone_id,zone_name,description,price)
VALUES (10,'VIP','VIP Zone',2000);

INSERT INTO seat_rows(row_id,zone_id,row_label,sort_order)
VALUES (20,10,'A',1);

INSERT INTO seats(seat_id,row_id,seat_number)
VALUES (30,20,1),(31,20,2);

INSERT INTO reserved_seats(reserved_id,seat_id)
VALUES (1,30),(2,31);

INSERT INTO ticket_types(ticket_type_id,event_id,type_name,price)
VALUES (7,100,'VIP',2000);

INSERT INTO reservations(reservation_id,user_id,reserve_code,status,created_at)
VALUES (10,50,'RC-10','PAID',CURRENT_TIMESTAMP);

INSERT INTO reservation_tickets(reservation_ticket_id,reservation_id,ticket_type_id,seat_row,seat_col,price)
VALUES (1000,10,7,'A','1',2000);
