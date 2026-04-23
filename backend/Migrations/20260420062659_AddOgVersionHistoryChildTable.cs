using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOgVersionHistoryChildTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderGovernanceVersionHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VersionNumber = table.Column<int>(type: "int", nullable: false),
                    ChangedBy = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    ChangedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ChangeSummary = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGovernanceVersionHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderGovernanceVersionHistory_OrderGovernanceDeals_DealId",
                        column: x => x.DealId,
                        principalTable: "OrderGovernanceDeals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceVersionHistory_DealId_ChangedAtUtc",
                table: "OrderGovernanceVersionHistory",
                columns: new[] { "DealId", "ChangedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceVersionHistory_DealId_VersionNumber",
                table: "OrderGovernanceVersionHistory",
                columns: new[] { "DealId", "VersionNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderGovernanceVersionHistory");
        }
    }
}
