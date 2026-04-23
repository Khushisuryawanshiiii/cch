using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddOgApproverLaneRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20333333-3333-3333-3333-333333333333") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20333333-3333-3333-3333-333333333333") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"), new Guid("20333333-3333-3333-3333-333333333333") });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"),
                column: "Description",
                value: "Review routed deals as required approver (legacy)");

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Action", "Description", "Module" },
                values: new object[,]
                {
                    { new Guid("4cc44620-1159-20ce-95e1-7acb54bfc0d7"), "deal.review_service_delivery", "Act as Service Delivery approver on routed deals", "order-governance" },
                    { new Guid("4edcda42-bb4e-35a3-0f3f-247c26053d43"), "deal.review_pre_sales", "Act as Pre-Sales approver on routed deals", "order-governance" },
                    { new Guid("a22373b0-b304-1373-996e-0f8d870bfea1"), "deal.review_scm", "Act as SCM approver on routed deals", "order-governance" },
                    { new Guid("bf21fbd1-89d4-2bbc-a5c2-ce0c17e08891"), "deal.review_legal", "Act as Legal approver on routed deals", "order-governance" },
                    { new Guid("cd894c87-2b7a-31be-89b4-874d6f2422d7"), "deal.review_business_head", "Act as Business Head approver on routed deals", "order-governance" },
                    { new Guid("e01a7bc6-2b71-44bb-72cf-454e6606d725"), "deal.review_finance", "Act as Finance approver on routed deals", "order-governance" }
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20333333-3333-3333-3333-333333333333"),
                column: "Description",
                value: "Deprecated: use order-governance.approver-* lane roles");

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { new Guid("20555555-5555-5555-5555-555555555501"), "Order Governance Finance approver lane", "order-governance.approver-finance" },
                    { new Guid("20555555-5555-5555-5555-555555555502"), "Order Governance Legal approver lane", "order-governance.approver-legal" },
                    { new Guid("20555555-5555-5555-5555-555555555503"), "Order Governance Business Head approver lane", "order-governance.approver-business-head" },
                    { new Guid("20555555-5555-5555-5555-555555555504"), "Order Governance SCM approver lane", "order-governance.approver-scm" },
                    { new Guid("20555555-5555-5555-5555-555555555505"), "Order Governance Service Delivery approver lane", "order-governance.approver-service-delivery" },
                    { new Guid("20555555-5555-5555-5555-555555555506"), "Order Governance Pre-Sales approver lane", "order-governance.approver-pre-sales" }
                });

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555501") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555501") },
                    { new Guid("e01a7bc6-2b71-44bb-72cf-454e6606d725"), new Guid("20555555-5555-5555-5555-555555555501") },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555502") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555502") },
                    { new Guid("bf21fbd1-89d4-2bbc-a5c2-ce0c17e08891"), new Guid("20555555-5555-5555-5555-555555555502") },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555503") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555503") },
                    { new Guid("cd894c87-2b7a-31be-89b4-874d6f2422d7"), new Guid("20555555-5555-5555-5555-555555555503") },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555504") },
                    { new Guid("a22373b0-b304-1373-996e-0f8d870bfea1"), new Guid("20555555-5555-5555-5555-555555555504") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555504") },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555505") },
                    { new Guid("4cc44620-1159-20ce-95e1-7acb54bfc0d7"), new Guid("20555555-5555-5555-5555-555555555505") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555505") },
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555506") },
                    { new Guid("4edcda42-bb4e-35a3-0f3f-247c26053d43"), new Guid("20555555-5555-5555-5555-555555555506") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555506") }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555501") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555501") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("e01a7bc6-2b71-44bb-72cf-454e6606d725"), new Guid("20555555-5555-5555-5555-555555555501") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555502") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555502") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("bf21fbd1-89d4-2bbc-a5c2-ce0c17e08891"), new Guid("20555555-5555-5555-5555-555555555502") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555503") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555503") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("cd894c87-2b7a-31be-89b4-874d6f2422d7"), new Guid("20555555-5555-5555-5555-555555555503") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555504") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("a22373b0-b304-1373-996e-0f8d870bfea1"), new Guid("20555555-5555-5555-5555-555555555504") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555504") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555505") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("4cc44620-1159-20ce-95e1-7acb54bfc0d7"), new Guid("20555555-5555-5555-5555-555555555505") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555505") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20555555-5555-5555-5555-555555555506") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("4edcda42-bb4e-35a3-0f3f-247c26053d43"), new Guid("20555555-5555-5555-5555-555555555506") });

            migrationBuilder.DeleteData(
                table: "RolePermissions",
                keyColumns: new[] { "PermissionId", "RoleId" },
                keyValues: new object[] { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20555555-5555-5555-5555-555555555506") });

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4cc44620-1159-20ce-95e1-7acb54bfc0d7"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("4edcda42-bb4e-35a3-0f3f-247c26053d43"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("a22373b0-b304-1373-996e-0f8d870bfea1"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("bf21fbd1-89d4-2bbc-a5c2-ce0c17e08891"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("cd894c87-2b7a-31be-89b4-874d6f2422d7"));

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e01a7bc6-2b71-44bb-72cf-454e6606d725"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555501"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555502"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555503"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555504"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555505"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20555555-5555-5555-5555-555555555506"));

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"),
                column: "Description",
                value: "Review routed deals as required approver");

            migrationBuilder.InsertData(
                table: "RolePermissions",
                columns: new[] { "PermissionId", "RoleId" },
                values: new object[,]
                {
                    { new Guid("15d0aec6-09ed-dbfe-1670-26624381aad1"), new Guid("20333333-3333-3333-3333-333333333333") },
                    { new Guid("ab1e5c52-665c-274f-af5e-7562d8e8e024"), new Guid("20333333-3333-3333-3333-333333333333") },
                    { new Guid("e1c4a91b-d8fe-bbe5-0a07-35285b3d4e20"), new Guid("20333333-3333-3333-3333-333333333333") }
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("20333333-3333-3333-3333-333333333333"),
                column: "Description",
                value: "Order Governance module Approver role");
        }
    }
}
