using backend.Data;
using backend.Entities;
using backend.Security;
using Microsoft.EntityFrameworkCore;

namespace backend.Seed;

/// <summary>Dev/test users: passwords and roles are defined in <c>usersToSeed</c>. On each startup, missing <see cref="UserRole"/> links are added (existing users are not removed).</summary>
public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        await dbContext.Database.MigrateAsync();

        var usersToSeed = new[]
        {
            new SeedUser("admin@commercialcontrolhub.local", "Platform Admin", "Admin@123", ["sales-process.sales-manager", "order-governance.reviewer"]),
            new SeedUser("sales.manager@commercialcontrolhub.local", "Sales Manager", "Sales@123", ["sales-process.sales-manager"]),
            new SeedUser("regional.manager@commercialcontrolhub.local", "Regional Manager", "Regional@123", ["sales-process.regional-manager"]),
            new SeedUser("central.manager@commercialcontrolhub.local", "Central Manager", "Central@123", ["sales-process.central-manager"]),
            new SeedUser("og.sales@commercialcontrolhub.local", "OG Sales", "OgSales@123", ["order-governance.sales", "sales-process.sales-manager"]),
            new SeedUser("og.reviewer@commercialcontrolhub.local", "OG Reviewer", "OgReviewer@123", ["order-governance.reviewer"]),
            new SeedUser("og.finance@commercialcontrolhub.local", "OG Finance Approver", "OgFinance@123", ["order-governance.approver-finance"]),
            new SeedUser("og.legal@commercialcontrolhub.local", "OG Legal Approver", "OgLegal@123", ["order-governance.approver-legal"]),
            new SeedUser("og.businesshead@commercialcontrolhub.local", "OG Business Head Approver", "OgBusinessHead@123", ["order-governance.approver-business-head"]),
            new SeedUser("og.scm@commercialcontrolhub.local", "OG SCM Approver", "OgScm@123", ["order-governance.approver-scm"]),
            new SeedUser("og.servicedelivery@commercialcontrolhub.local", "OG Service Delivery Approver", "OgServiceDelivery@123", ["order-governance.approver-service-delivery"]),
            new SeedUser("og.presales@commercialcontrolhub.local", "OG Pre-Sales Approver", "OgPreSales@123", ["order-governance.approver-pre-sales"]),
            new SeedUser("og.ccmanager@commercialcontrolhub.local", "OG CC Manager", "OgCC@123", ["order-governance.cc-manager"])
        };

        foreach (var seedUser in usersToSeed)
        {
            var email = seedUser.Email.ToLowerInvariant();
            var user = await dbContext.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user is null)
            {
                user = new AppUser
                {
                    Email = email,
                    DisplayName = seedUser.DisplayName,
                    PasswordHash = PasswordHasher.Hash(seedUser.Password),
                    IsActive = true
                };
                dbContext.Users.Add(user);
                await dbContext.SaveChangesAsync();
            }

            foreach (var roleName in seedUser.RoleNames)
            {
                var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
                if (role is null)
                {
                    continue;
                }

                var alreadyAssigned = await dbContext.UserRoles.AnyAsync(ur => ur.UserId == user.Id && ur.RoleId == role.Id);
                if (!alreadyAssigned)
                {
                    dbContext.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
                }
            }
        }

        await dbContext.SaveChangesAsync();
    }

    private sealed record SeedUser(string Email, string DisplayName, string Password, string[] RoleNames);
}
