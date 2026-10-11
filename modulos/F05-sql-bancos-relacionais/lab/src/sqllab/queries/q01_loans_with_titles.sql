-- INNER JOIN across three tables: one row per loan, with book title and member name.
SELECT l.id AS loan_id, m.name AS member, b.title, l.loaned_on
FROM loan AS l
JOIN book AS b ON b.id = l.book_id
JOIN member AS m ON m.id = l.member_id
ORDER BY l.id;
