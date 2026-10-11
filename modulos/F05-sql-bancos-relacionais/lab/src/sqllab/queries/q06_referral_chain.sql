-- Recursive CTE going UP: who referred whom, from :member_id to the root.
WITH RECURSIVE chain (id, name, referred_by, depth) AS (
    SELECT id, name, referred_by, 0
    FROM member
    WHERE id = :member_id
    UNION ALL
    SELECT m.id, m.name, m.referred_by, c.depth + 1
    FROM member AS m
    JOIN chain AS c ON m.id = c.referred_by
)
SELECT depth, id, name
FROM chain
ORDER BY depth;
