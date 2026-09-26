"""add meta column and created_at index.

Revision ID: 0002
Revises: 0001
Create Date: lote B03 do M03.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("links", sa.Column("meta", JSONB(), nullable=False, server_default="{}"))
    op.create_index("ix_links_created_at", "links", ["created_at"])
    op.create_index("ix_links_meta", "links", ["meta"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_index("ix_links_meta", table_name="links")
    op.drop_index("ix_links_created_at", table_name="links")
    op.drop_column("links", "meta")
