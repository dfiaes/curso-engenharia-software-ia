-- GROUP BY + HAVING: members with open loans past due on :today.
SELECT m.name AS member,
       COUNT(*) AS overdue_loans,
       CAST(MAX(julianday(:today) - julianday(l.due_on)) AS INTEGER) AS max_days_late
FROM loan AS l
JOIN member AS m ON m.id = l.member_id
WHERE l.returned_on IS NULL AND l.due_on < :today
GROUP BY m.id, m.name
HAVING COUNT(*) >= 1
ORDER BY max_days_late DESC, m.name;
