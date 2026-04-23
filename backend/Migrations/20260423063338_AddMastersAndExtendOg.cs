using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddMastersAndExtendOg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Department",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeCode",
                table: "Users",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "UserRoles",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "UserRoles",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Roles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Roles",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Roles",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModuleId",
                table: "Roles",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Permissions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Permissions",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModuleId",
                table: "Permissions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Permissions",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ChangedByUserId",
                table: "OrderGovernanceVersionHistory",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SnapshotJson",
                table: "OrderGovernanceVersionHistory",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TriggerEvent",
                table: "OrderGovernanceVersionHistory",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VerticalId",
                table: "OrderGovernanceVersionHistory",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ActorRoleId",
                table: "OrderGovernanceHistory",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ActorUserId",
                table: "OrderGovernanceHistory",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovalId",
                table: "OrderGovernanceHistory",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ConversionRate",
                table: "OrderGovernanceDeals",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByUserId",
                table: "OrderGovernanceDeals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HorizontalId",
                table: "OrderGovernanceDeals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAtUtc",
                table: "OrderGovernanceDeals",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VerticalId",
                table: "OrderGovernanceDeals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedUserId",
                table: "OrderGovernanceApprovals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRequired",
                table: "OrderGovernanceApprovals",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<Guid>(
                name: "RoleId",
                table: "OrderGovernanceApprovals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VerticalId",
                table: "OrderGovernanceApprovals",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HorizontalMaster",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HorizontalMaster", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ModuleMaster",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModuleMaster", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderGovernanceCostBreakup",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CostTypeCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CostTypeLabel = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGovernanceCostBreakup", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderGovernanceCostBreakup_OrderGovernanceDeals_DealId",
                        column: x => x.DealId,
                        principalTable: "OrderGovernanceDeals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrderGovernanceExecution",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SapOrderNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CustomerPoNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FinalPoValue = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    ConfirmedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ConfirmedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGovernanceExecution", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderGovernanceExecution_OrderGovernanceDeals_DealId",
                        column: x => x.DealId,
                        principalTable: "OrderGovernanceDeals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderGovernanceExecution_Users_ConfirmedByUserId",
                        column: x => x.ConfirmedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VerticalMaster",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerticalMaster", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    EntityName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    ReferenceId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Action = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    OldValuesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NewValuesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PerformedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PerformedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CorrelationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_ModuleMaster_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "ModuleMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_PerformedByUserId",
                        column: x => x.PerformedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReferenceId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    ActionUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    ReadAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_ModuleMaster_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "ModuleMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ApprovalRoleAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VerticalId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    EffectiveFromUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EffectiveToUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovalRoleAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovalRoleAssignments_ModuleMaster_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "ModuleMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApprovalRoleAssignments_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApprovalRoleAssignments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ApprovalRoleAssignments_VerticalMaster_VerticalId",
                        column: x => x.VerticalId,
                        principalTable: "VerticalMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MarginThresholdConfig",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ModuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VerticalId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MinMarginPercent = table.Column<decimal>(type: "decimal(9,4)", precision: 9, scale: 4, nullable: false),
                    MaxMarginPercent = table.Column<decimal>(type: "decimal(9,4)", precision: 9, scale: 4, nullable: false),
                    ApprovalLevel = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    EffectiveFromUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EffectiveToUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarginThresholdConfig", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MarginThresholdConfig_ModuleMaster_ModuleId",
                        column: x => x.ModuleId,
                        principalTable: "ModuleMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MarginThresholdConfig_VerticalMaster_VerticalId",
                        column: x => x.VerticalId,
                        principalTable: "VerticalMaster",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MarginThresholdRoles",
                columns: table => new
                {
                    ThresholdId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MarginThresholdRoles", x => new { x.ThresholdId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_MarginThresholdRoles_MarginThresholdConfig_ThresholdId",
                        column: x => x.ThresholdId,
                        principalTable: "MarginThresholdConfig",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MarginThresholdRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "ModuleMaster",
                columns: new[] { "Id", "Code", "CreatedAtUtc", "IsActive", "Name" },
                values: new object[,]
                {
                    { new Guid("a0000000-0000-0000-0000-000000000001"), "sales-process", new DateTime(2026, 4, 23, 0, 0, 0, 0, DateTimeKind.Utc), true, "Sales Process" },
                    { new Guid("a0000000-0000-0000-0000-000000000002"), "order-governance", new DateTime(2026, 4, 23, 0, 0, 0, 0, DateTimeKind.Utc), true, "Order Governance" }
                });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("03369e65-16f6-def9-d2de-0920b486c7d2"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.review_l1" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("0f66fb4e-ed9a-4f66-9fa7-bb012d0796e4"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.create" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.approve" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("1844d772-0549-7d02-40ca-3e9657679b15"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.manage_documents" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("1a967c11-3df0-af79-1dde-9bd31284919e"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "route.configure" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("238cdce1-4d3d-2f54-f859-9ba888c8a263"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.ingest_excel" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("3472623a-0c6c-b99f-529d-07483abc9e5f"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.submit" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("438113cf-6573-bf91-4877-90079901d184"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.reject_l1" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("48628b11-f729-6274-c461-58feb29aa95e"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "final.confirm_order" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4cc44620-1159-20ce-95e1-7acb54bfc0d7"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_service_delivery" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4cc743a9-e9ed-4b76-f5a1-42b42f673bab"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.review_l2" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4edcda42-bb4e-35a3-0f3f-247c26053d43"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_pre_sales" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("5e01887b-bb75-a2a7-d2b2-d6602217cef9"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.approve_l1" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("659ac5ea-dcd6-70bd-4ecc-2a7f1c14f147"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.edit_amount_l1" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("6da70d6c-f186-252e-6264-180bd89b51ff"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.submit" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("7af0f504-a99c-80bc-556d-83a621fa5b29"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.reject_l2" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("9e2686cb-9559-c2c8-61b0-4ce14aad095f"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "final.capture_po" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a22373b0-b304-1373-996e-0f8d870bfea1"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_scm" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.reject" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("b40a7a47-b313-75eb-4dd0-65c86560d81a"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.enrich" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("bf21fbd1-89d4-2bbc-a5c2-ce0c17e08891"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_legal" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("cb67e22c-9f3d-8828-5ccd-3b7cbc8b58fa"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.edit_draft" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("cd894c87-2b7a-31be-89b4-874d6f2422d7"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_business_head" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("dc1f1565-8a15-4b80-2103-d92bb8fc98c7"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.triage" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e01a7bc6-2b71-44bb-72cf-454e6606d725"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_finance" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.review_required" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e804a99f-9f9e-bcac-1103-ad8af3d1e9a9"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000002"), "deal.return_to_sales" });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("ef9d663f-9bb6-0687-f293-308b24b26b49"),
                columns: new[] { "IsActive", "ModuleId", "Name" },
                values: new object[] { true, new Guid("a0000000-0000-0000-0000-000000000001"), "deal.approve_l2" });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("10111111-1111-1111-1111-111111111111"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "sales-manager", true, new Guid("a0000000-0000-0000-0000-000000000001") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("10222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "regional-manager", true, new Guid("a0000000-0000-0000-0000-000000000001") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("10333333-3333-3333-3333-333333333333"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "central-manager", true, new Guid("a0000000-0000-0000-0000-000000000001") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20111111-1111-1111-1111-111111111111"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "sales", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20222222-2222-2222-2222-222222222222"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "reviewer", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20333333-3333-3333-3333-333333333333"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver", false, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20444444-4444-4444-4444-444444444444"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "cc-manager", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555501"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver-finance", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555502"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver-legal", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555503"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver-business-head", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555504"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver-scm", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555505"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver-service-delivery", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555506"),
                columns: new[] { "Code", "IsActive", "ModuleId" },
                values: new object[] { "approver-pre-sales", true, new Guid("a0000000-0000-0000-0000-000000000002") });

            migrationBuilder.CreateIndex(
                name: "IX_Users_EmployeeCode",
                table: "Users",
                column: "EmployeeCode");

            migrationBuilder.CreateIndex(
                name: "IX_Roles_ModuleId_Code",
                table: "Roles",
                columns: new[] { "ModuleId", "Code" });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_ModuleId_Action",
                table: "Permissions",
                columns: new[] { "ModuleId", "Action" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceVersionHistory_ChangedByUserId",
                table: "OrderGovernanceVersionHistory",
                column: "ChangedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceVersionHistory_VerticalId",
                table: "OrderGovernanceVersionHistory",
                column: "VerticalId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceHistory_ActorRoleId",
                table: "OrderGovernanceHistory",
                column: "ActorRoleId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceHistory_ActorUserId",
                table: "OrderGovernanceHistory",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceHistory_ApprovalId",
                table: "OrderGovernanceHistory",
                column: "ApprovalId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceDeals_CreatedByUserId",
                table: "OrderGovernanceDeals",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceDeals_HorizontalId",
                table: "OrderGovernanceDeals",
                column: "HorizontalId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceDeals_VerticalId",
                table: "OrderGovernanceDeals",
                column: "VerticalId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceApprovals_AssignedUserId",
                table: "OrderGovernanceApprovals",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceApprovals_DealId_Status",
                table: "OrderGovernanceApprovals",
                columns: new[] { "DealId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceApprovals_RoleId",
                table: "OrderGovernanceApprovals",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceApprovals_VerticalId",
                table: "OrderGovernanceApprovals",
                column: "VerticalId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoleAssignments_ModuleId_RoleId_VerticalId_UserId",
                table: "ApprovalRoleAssignments",
                columns: new[] { "ModuleId", "RoleId", "VerticalId", "UserId" },
                unique: true,
                filter: "[VerticalId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoleAssignments_RoleId_IsActive",
                table: "ApprovalRoleAssignments",
                columns: new[] { "RoleId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoleAssignments_UserId",
                table: "ApprovalRoleAssignments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoleAssignments_VerticalId",
                table: "ApprovalRoleAssignments",
                column: "VerticalId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityName_ReferenceId",
                table: "AuditLogs",
                columns: new[] { "EntityName", "ReferenceId" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_ModuleId_PerformedAtUtc",
                table: "AuditLogs",
                columns: new[] { "ModuleId", "PerformedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_PerformedByUserId",
                table: "AuditLogs",
                column: "PerformedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_HorizontalMaster_Code",
                table: "HorizontalMaster",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MarginThresholdConfig_ModuleId_VerticalId_IsActive",
                table: "MarginThresholdConfig",
                columns: new[] { "ModuleId", "VerticalId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_MarginThresholdConfig_VerticalId",
                table: "MarginThresholdConfig",
                column: "VerticalId");

            migrationBuilder.CreateIndex(
                name: "IX_MarginThresholdRoles_RoleId",
                table: "MarginThresholdRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_ModuleMaster_Code",
                table: "ModuleMaster",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_ModuleId",
                table: "Notifications",
                column: "ModuleId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead_CreatedAtUtc",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceCostBreakup_DealId_CostTypeCode",
                table: "OrderGovernanceCostBreakup",
                columns: new[] { "DealId", "CostTypeCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceExecution_ConfirmedByUserId",
                table: "OrderGovernanceExecution",
                column: "ConfirmedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceExecution_DealId",
                table: "OrderGovernanceExecution",
                column: "DealId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerticalMaster_Code",
                table: "VerticalMaster",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceApprovals_Roles_RoleId",
                table: "OrderGovernanceApprovals",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceApprovals_Users_AssignedUserId",
                table: "OrderGovernanceApprovals",
                column: "AssignedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceApprovals_VerticalMaster_VerticalId",
                table: "OrderGovernanceApprovals",
                column: "VerticalId",
                principalTable: "VerticalMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceDeals_HorizontalMaster_HorizontalId",
                table: "OrderGovernanceDeals",
                column: "HorizontalId",
                principalTable: "HorizontalMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceDeals_Users_CreatedByUserId",
                table: "OrderGovernanceDeals",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceDeals_VerticalMaster_VerticalId",
                table: "OrderGovernanceDeals",
                column: "VerticalId",
                principalTable: "VerticalMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceHistory_OrderGovernanceApprovals_ApprovalId",
                table: "OrderGovernanceHistory",
                column: "ApprovalId",
                principalTable: "OrderGovernanceApprovals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceHistory_Roles_ActorRoleId",
                table: "OrderGovernanceHistory",
                column: "ActorRoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceHistory_Users_ActorUserId",
                table: "OrderGovernanceHistory",
                column: "ActorUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceVersionHistory_Users_ChangedByUserId",
                table: "OrderGovernanceVersionHistory",
                column: "ChangedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_OrderGovernanceVersionHistory_VerticalMaster_VerticalId",
                table: "OrderGovernanceVersionHistory",
                column: "VerticalId",
                principalTable: "VerticalMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Permissions_ModuleMaster_ModuleId",
                table: "Permissions",
                column: "ModuleId",
                principalTable: "ModuleMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Roles_ModuleMaster_ModuleId",
                table: "Roles",
                column: "ModuleId",
                principalTable: "ModuleMaster",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceApprovals_Roles_RoleId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceApprovals_Users_AssignedUserId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceApprovals_VerticalMaster_VerticalId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceDeals_HorizontalMaster_HorizontalId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceDeals_Users_CreatedByUserId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceDeals_VerticalMaster_VerticalId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceHistory_OrderGovernanceApprovals_ApprovalId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceHistory_Roles_ActorRoleId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceHistory_Users_ActorUserId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceVersionHistory_Users_ChangedByUserId",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_OrderGovernanceVersionHistory_VerticalMaster_VerticalId",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_Permissions_ModuleMaster_ModuleId",
                table: "Permissions");

            migrationBuilder.DropForeignKey(
                name: "FK_Roles_ModuleMaster_ModuleId",
                table: "Roles");

            migrationBuilder.DropTable(
                name: "ApprovalRoleAssignments");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "HorizontalMaster");

            migrationBuilder.DropTable(
                name: "MarginThresholdRoles");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "OrderGovernanceCostBreakup");

            migrationBuilder.DropTable(
                name: "OrderGovernanceExecution");

            migrationBuilder.DropTable(
                name: "MarginThresholdConfig");

            migrationBuilder.DropTable(
                name: "ModuleMaster");

            migrationBuilder.DropTable(
                name: "VerticalMaster");

            migrationBuilder.DropIndex(
                name: "IX_Users_EmployeeCode",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Roles_ModuleId_Code",
                table: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_Permissions_ModuleId_Action",
                table: "Permissions");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceVersionHistory_ChangedByUserId",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceVersionHistory_VerticalId",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceHistory_ActorRoleId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceHistory_ActorUserId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceHistory_ApprovalId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceDeals_CreatedByUserId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceDeals_HorizontalId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceDeals_VerticalId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceApprovals_AssignedUserId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceApprovals_DealId_Status",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceApprovals_RoleId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropIndex(
                name: "IX_OrderGovernanceApprovals_VerticalId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropColumn(
                name: "Department",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmployeeCode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "UserRoles");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "UserRoles");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "ModuleId",
                table: "Roles");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "ModuleId",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "ChangedByUserId",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropColumn(
                name: "SnapshotJson",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropColumn(
                name: "TriggerEvent",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropColumn(
                name: "VerticalId",
                table: "OrderGovernanceVersionHistory");

            migrationBuilder.DropColumn(
                name: "ActorRoleId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropColumn(
                name: "ActorUserId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropColumn(
                name: "ApprovalId",
                table: "OrderGovernanceHistory");

            migrationBuilder.DropColumn(
                name: "ConversionRate",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropColumn(
                name: "HorizontalId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropColumn(
                name: "SubmittedAtUtc",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropColumn(
                name: "VerticalId",
                table: "OrderGovernanceDeals");

            migrationBuilder.DropColumn(
                name: "AssignedUserId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropColumn(
                name: "IsRequired",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.DropColumn(
                name: "VerticalId",
                table: "OrderGovernanceApprovals");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Roles",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Permissions",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(500)",
                oldMaxLength: 500);
        }
    }
}
