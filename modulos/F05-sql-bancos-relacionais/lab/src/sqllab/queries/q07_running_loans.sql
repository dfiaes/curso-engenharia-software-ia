-- Window functions: running count per member and days since the previous loan.
SELECT member_id,
       id AS loan_id,
       loaned_on,
       COUNT(*) OVER (PARTITION BY member_id ORDER BY loaned_on, id) AS loans_so_far,
       CAST(julianday(loaned_on) - julianday(
           LAG(loaned_on) OVER (PARTITION BY member_id ORDER BY loaned_on, id)
       ) AS INTEGER) AS days_since_previous
FROM loan
ORDER BY member_id, loaned_on, id;
