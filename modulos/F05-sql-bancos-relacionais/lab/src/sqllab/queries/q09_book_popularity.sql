-- ROW_NUMBER vs RANK vs DENSE_RANK on tied counts.
WITH counts AS (
    SELECT b.id, b.title, COUNT(l.id) AS loans
    FROM book AS b
    LEFT JOIN loan AS l ON l.book_id = b.id
    GROUP BY b.id, b.title
)
SELECT title,
       loans,
       ROW_NUMBER() OVER (ORDER BY loans DESC, title) AS row_number,
       RANK()       OVER (ORDER BY loans DESC)        AS rank,
       DENSE_RANK() OVER (ORDER BY loans DESC)        AS dense_rank
FROM counts
ORDER BY loans DESC, title;
