const [ticketTypes] = await pool.execute(
  `
  SELECT
    tt.ticket_type_id AS id,
    tt.type_name AS name,
    tt.price AS price,
    tt.description AS description,
    COUNT(t.ticket_id) AS total_tickets,
    COALESCE(
      SUM(CASE WHEN t.ticket_status = 'AVAILABLE' THEN 1 ELSE 0 END),
      0
    ) AS available_tickets
  FROM TicketType tt
  LEFT JOIN Ticket t
    ON t.ticket_type_id = tt.ticket_type_id
    AND t.concert_id = ?
  GROUP BY
    tt.ticket_type_id,
    tt.type_name,
    tt.price,
    tt.description
  ORDER BY tt.price ASC
  `,
  [concertId]
);