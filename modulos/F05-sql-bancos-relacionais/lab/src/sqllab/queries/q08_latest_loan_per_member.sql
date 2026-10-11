-- ROW_NUMBER inside a CTE: "top 1 per group". Window results cannot be filtered in WHERE.
WITH ranked AS (
    SELECT member_id, id AS loan_id, book_id, loaned_on,
           ROW_NUMBER() OVER (PARTITION BY member_id ORDER BY loaned_on DESC, id DESC) AS rn
    FROM loan
)
SELECT member_id, loan_id, book_id, loaned_on
FROM ranked
WHERE rn = 1
ORDER BY member_id;
