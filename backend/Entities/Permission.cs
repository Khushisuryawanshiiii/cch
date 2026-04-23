namespace backend.Entities;

public class Permission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Module { get; set; } = string.Empty;
    public Guid? ModuleId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ModuleMaster? ModuleRef { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; } = [];
}
