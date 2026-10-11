-- 002: indexes that serve the foreign keys and the "open loans" access path.
CREATE INDEX idx_loan_member_loaned ON loan (member_id, loaned_on);
CREATE INDEX idx_loan_book ON loan (book_id);
CREATE INDEX idx_loan_open ON loan (due_on) WHERE returned_on IS NULL;
