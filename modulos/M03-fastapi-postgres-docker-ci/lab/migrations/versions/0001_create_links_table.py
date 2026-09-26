"""create links table.

Revision ID: 0001
Revises: None
Create Date: lote B02 do M03.
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "links",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(16), nullable=False),
        sa.Column("url", sa.String(2048), nullable=False),
        sa.Column("hits", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("slug", name="uq_links_slug"),
    )
    op.create_index("ix_links_slug", "links", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_links_slug", table_name="links")
    op.drop_table("links")
