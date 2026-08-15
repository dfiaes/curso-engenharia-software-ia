-- Non-sensitive reference data only. Product/tenant fixtures are introduced in B05.
INSERT INTO release_metadata(release_id, commit_sha)
VALUES ('local-reference', 'UNBUILT')
ON CONFLICT (release_id) DO NOTHING;
