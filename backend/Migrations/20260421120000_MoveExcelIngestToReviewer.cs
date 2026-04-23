using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class MoveExcelIngestToReviewer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Revoke deal.ingest_excel from order-governance.sales.
            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[]
                {
                    new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"),
                    new Guid("20111111-1111-1111-1111-111111111111")
                });

            // Grant deal.ingest_excel to order-governance.reviewer.
            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[]
                {
                    new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"),
                    new Guid("20222222-2222-2222-2222-222222222222")
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[]
                {
                    new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"),
                    new Guid("20222222-2222-2222-2222-222222222222")
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[]
                {
                    new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"),
                    new Guid("20111111-1111-1111-1111-111111111111")
                });
        }
    }
}
