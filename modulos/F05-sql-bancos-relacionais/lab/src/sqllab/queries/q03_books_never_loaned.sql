-- NOT EXISTS: books with no loan row. Correct even if loan.book_id could be NULL.
SELECT b.id, b.title
FROM book AS b
WHERE NOT EXISTS (SELECT 1 FROM loan AS l WHERE l.book_id = b.id)
ORDER BY b.id;
