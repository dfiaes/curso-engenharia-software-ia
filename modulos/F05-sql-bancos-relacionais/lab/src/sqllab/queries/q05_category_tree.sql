-- Recursive CTE: walk the category hierarchy from the roots down.
WITH RECURSIVE tree (id, name, depth, path) AS (
    SELECT id, name, 0, name
    FROM category
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, t.depth + 1, t.path || ' > ' || c.name
    FROM category AS c
    JOIN tree AS t ON c.parent_id = t.id
)
SELECT id, depth, path
FROM tree
ORDER BY path;
