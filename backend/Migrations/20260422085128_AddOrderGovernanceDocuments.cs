using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderGovernanceDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderGovernanceDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    UploadedBy = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    UploadedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGovernanceDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderGovernanceDocuments_OrderGovernanceDeals_DealId",
                        column: x => x.DealId,
                        principalTable: "OrderGovernanceDeals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Description", "Module" },
                values: new object[] { new Guid("1844d772-0549-7d02-40ca-3e9657679b15"), "deal.manage_documents", "Upload and delete order-governance deal documents", "order-governance" });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("1844d772-0549-7d02-40ca-3e9657679b15"), new Guid("20111111-1111-1111-1111-111111111111") },
                    { new Guid("1844d772-0549-7d02-40ca-3e9657679b15"), new Guid("20222222-2222-2222-2222-222222222222") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceDocuments_DealId_UploadedAtUtc",
                table: "OrderGovernanceDocuments",
                columns: new[] { "DealId", "UploadedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderGovernanceDocuments");

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("1844d772-0549-7d02-40ca-3e9657679b15"), new Guid("20111111-1111-1111-1111-111111111111") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("1844d772-0549-7d02-40ca-3e9657679b15"), new Guid("20222222-2222-2222-2222-222222222222") });

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("1844d772-0549-7d02-40ca-3e9657679b15"));
        }
    }
}
