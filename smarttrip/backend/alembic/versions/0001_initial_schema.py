"""Create the initial SmartTrip spatial schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-26
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from geoalchemy2 import Geometry


revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "locations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("city", sa.String(), nullable=False),
        sa.Column("geom", Geometry("POINT", srid=4326), nullable=False),
        sa.Column("is_boarding_point", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_dropoff_point", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_locations_name", "locations", ["name"])
    op.create_index("ix_locations_city", "locations", ["city"])
    op.create_index("ix_locations_geom", "locations", ["geom"], postgresql_using="gist")

    op.create_table(
        "buses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("operator_name", sa.String(), nullable=False),
        sa.Column("bus_number", sa.String(), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("base_fare", sa.Float(), nullable=False),
        sa.Column("commission_rate", sa.Float(), nullable=False, server_default="0.05"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("bus_number"),
    )
    op.create_index("ix_buses_id", "buses", ["id"])

    op.create_table(
        "feeder_corridors",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("start_location_id", sa.Integer(), nullable=False),
        sa.Column("end_location_id", sa.Integer(), nullable=False),
        sa.Column("flat_fare", sa.Float(), nullable=False, server_default="50.0"),
        sa.ForeignKeyConstraint(["end_location_id"], ["locations.id"]),
        sa.ForeignKeyConstraint(["start_location_id"], ["locations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_feeder_corridors_id", "feeder_corridors", ["id"])


def downgrade() -> None:
    op.drop_index("ix_feeder_corridors_id", table_name="feeder_corridors")
    op.drop_table("feeder_corridors")
    op.drop_index("ix_buses_id", table_name="buses")
    op.drop_table("buses")
    op.drop_index("ix_locations_geom", table_name="locations")
    op.drop_index("ix_locations_city", table_name="locations")
    op.drop_index("ix_locations_name", table_name="locations")
    op.drop_table("locations")
