-- LEFT JOIN + IS NULL: the anti-join. Authors that have no book.
SELECT a.id, a.name
FROM author AS a
LEFT JOIN book AS b ON b.author_id = a.id
WHERE b.id IS NULL
ORDER BY a.id;
