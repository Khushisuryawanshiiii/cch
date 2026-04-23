using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialRbacSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Permissions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Module = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Action = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RolePermissions",
                columns: table => new
                {
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PermissionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolePermissions", x => new { x.RoleId, x.PermissionId });
                    table.ForeignKey(
                        name: "FK_RolePermissions_Permissions_PermissionId",
                        column: x => x.PermissionId,
                        principalTable: "Permissions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RolePermissions_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Description", "Module" },
                values: new object[,]
                {
                    { new Guid("03369e65-16f6-def9-d2de-0920b486c7d2"), "deal.review_l1", "Review deals at L1", "sales-process" },
                    { new Guid("0f66fb4e-ed9a-4f66-9fa7-bb012d0796e4"), "deal.create", "Create sales-process deals", "sales-process" },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), "deal.approve", "Approve order-governance deal", "order-governance" },
                    { new Guid("1a967c11-3df0-af79-1dde-9bd31284919e"), "route.configure", "Configure required approver route", "order-governance" },
                    { new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"), "deal.ingest_excel", "Ingest Salesforce Excel dump", "order-governance" },
                    { new Guid("3472623a-0c6c-b99f-529d-07483abc9e5f"), "deal.submit", "Submit order-governance deal for review", "order-governance" },
                    { new Guid("438113cf-6573-bf91-4877-90079901d184"), "deal.reject_l1", "Reject deals at L1", "sales-process" },
                    { new Guid("48628b11-f729-6274-c461-58feb29aa95e"), "final.confirm_order", "Confirm final order execution", "order-governance" },
                    { new Guid("4cc743a9-e9ed-4b76-f5a1-42b42f673bab"), "deal.review_l2", "Review deals at L2", "sales-process" },
                    { new Guid("5e01887b-bb75-a2a7-d2b2-d6602217cef9"), "deal.approve_l1", "Approve deals at L1", "sales-process" },
                    { new Guid("659ac5ea-dcd6-70bd-4ecc-2a7f1c14f147"), "deal.edit_amount_l1", "Update deal amount at L1 within guardrails", "sales-process" },
                    { new Guid("6da70d6c-f186-252e-6264-180bd89b51ff"), "deal.submit", "Submit sales-process deals for L1 review", "sales-process" },
                    { new Guid("7af0f504-a99c-80bc-556d-83a621fa5b29"), "deal.reject_l2", "Reject deals at L2", "sales-process" },
                    { new Guid("9e2686cb-9559-c2c8-61b0-4ce14aad095f"), "final.capture_po", "Capture Actual PO/SAP/Customer order details", "order-governance" },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), "deal.reject", "Reject order-governance deal", "order-governance" },
                    { new Guid("b40a7a47-b313-75eb-4dd0-65c86560d81a"), "deal.enrich", "Enrich order-governance deal details", "order-governance" },
                    { new Guid("cb67e22c-9f3d-8828-5ccd-3b7cbc8b58fa"), "deal.edit_draft", "Edit draft or rejected sales-process deals", "sales-process" },
                    { new Guid("dc1f1565-8a15-4b80-2103-d92bb8fc98c7"), "deal.triage", "Triage submitted deals", "order-governance" },
                    { new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"), "deal.review_required", "Review routed deals as required approver", "order-governance" },
                    { new Guid("e804a99f-9f9e-bcac-1103-ad8af3d1e9a9"), "deal.return_to_sales", "Return deal to sales for correction", "order-governance" },
                    { new Guid("ef9d663f-9bb6-0687-f293-308b24b26b49"), "deal.approve_l2", "Final approve deals at L2", "sales-process" }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { new Guid("10111111-1111-1111-1111-111111111111"), "Sales Process module Sales Manager", "sales-process.sales-manager" },
                    { new Guid("10222222-2222-2222-2222-222222222222"), "Sales Process module Regional Manager (L1)", "sales-process.regional-manager" },
                    { new Guid("10333333-3333-3333-3333-333333333333"), "Sales Process module Central Manager (L2)", "sales-process.central-manager" },
                    { new Guid("20111111-1111-1111-1111-111111111111"), "Order Governance module Sales role", "order-governance.sales" },
                    { new Guid("20222222-2222-2222-2222-222222222222"), "Order Governance module Reviewer role", "order-governance.reviewer" },
                    { new Guid("20333333-3333-3333-3333-333333333333"), "Order Governance module Approver role", "order-governance.approver" },
                    { new Guid("20444444-4444-4444-4444-444444444444"), "Order Governance module CC Manager role", "order-governance.cc-manager" }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("0f66fb4e-ed9a-4f66-9fa7-bb012d0796e4"), new Guid("10111111-1111-1111-1111-111111111111") },
                    { new Guid("6da70d6c-f186-252e-6264-180bd89b51ff"), new Guid("10111111-1111-1111-1111-111111111111") },
                    { new Guid("cb67e22c-9f3d-8828-5ccd-3b7cbc8b58fa"), new Guid("10111111-1111-1111-1111-111111111111") },
                    { new Guid("03369e65-16f6-def9-d2de-0920b486c7d2"), new Guid("10222222-2222-2222-2222-222222222222") },
                    { new Guid("438113cf-6573-bf91-4877-90079901d184"), new Guid("10222222-2222-2222-2222-222222222222") },
                    { new Guid("5e01887b-bb75-a2a7-d2b2-d6602217cef9"), new Guid("10222222-2222-2222-2222-222222222222") },
                    { new Guid("659ac5ea-dcd6-70bd-4ecc-2a7f1c14f147"), new Guid("10222222-2222-2222-2222-222222222222") },
                    { new Guid("4cc743a9-e9ed-4b76-f5a1-42b42f673bab"), new Guid("10333333-3333-3333-3333-333333333333") },
                    { new Guid("7af0f504-a99c-80bc-556d-83a621fa5b29"), new Guid("10333333-3333-3333-3333-333333333333") },
                    { new Guid("ef9d663f-9bb6-0687-f293-308b24b26b49"), new Guid("10333333-3333-3333-3333-333333333333") },
                    { new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"), new Guid("20111111-1111-1111-1111-111111111111") },
                    { new Guid("3472623a-0c6c-b99f-529d-07483abc9e5f"), new Guid("20111111-1111-1111-1111-111111111111") },
                    { new Guid("b40a7a47-b313-75eb-4dd0-65c86560d81a"), new Guid("20111111-1111-1111-1111-111111111111") },
                    { new Guid("1a967c11-3df0-af79-1dde-9bd31284919e"), new Guid("20222222-2222-2222-2222-222222222222") },
                    { new Guid("dc1f1565-8a15-4b80-2103-d92bb8fc98c7"), new Guid("20222222-2222-2222-2222-222222222222") },
                    { new Guid("e804a99f-9f9e-bcac-1103-ad8af3d1e9a9"), new Guid("20222222-2222-2222-2222-222222222222") },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20333333-3333-3333-3333-333333333333") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20333333-3333-3333-3333-333333333333") },
                    { new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"), new Guid("20333333-3333-3333-3333-333333333333") },
                    { new Guid("48628b11-f729-6274-c461-58feb29aa95e"), new Guid("20444444-4444-4444-4444-444444444444") },
                    { new Guid("9e2686cb-9559-c2c8-61b0-4ce14aad095f"), new Guid("20444444-4444-4444-4444-444444444444") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Module_Action",
                table: "Permissions",
                columns: new[] { "Module", "Action" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_PermissionId",
                table: "RolePermissions",
                column: "PermissionId");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_RoleId",
                table: "UserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RolePermissions");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Permissions");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
