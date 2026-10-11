-- Self join: every member with the name of who referred them (NULL when nobody did).
SELECT m.name AS member, r.name AS referred_by
FROM member AS m
LEFT JOIN member AS r ON r.id = m.referred_by
ORDER BY m.id;
