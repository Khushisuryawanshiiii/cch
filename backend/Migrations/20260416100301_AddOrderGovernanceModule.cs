using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderGovernanceModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderGovernanceDeals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OpportunityNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    AccountName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    OpportunityName = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Stage = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    OpportunityOwner = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Geo = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    DeliveryType = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Version = table.Column<int>(type: "int", nullable: false),
                    ProductValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ServiceValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AmcValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OthersValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ProductCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ExternalServiceCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    InternalCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OthersCost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CustomerPaymentTerm = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    VendorPaymentTerm = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    ActualPoValue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SapOrder = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CustomerOrderNo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RequiredApprovalsCsv = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGovernanceDeals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderGovernanceApprovals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleKey = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ActionDateUtc = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderGovernanceApprovals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderGovernanceApprovals_OrderGovernanceDeals_DealId",
                        column: x => x.DealId,
                        principalTable: "OrderGovernanceDeals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceApprovals_DealId_RoleKey",
                table: "OrderGovernanceApprovals",
                columns: new[] { "DealId", "RoleKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderGovernanceDeals_OpportunityNumber",
                table: "OrderGovernanceDeals",
                column: "OpportunityNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderGovernanceApprovals");

            migrationBuilder.DropTable(
                name: "OrderGovernanceDeals");
        }
    }
}
