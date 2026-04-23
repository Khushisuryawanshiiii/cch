using backend.Entities;

namespace backend.Security;

public interface ITokenService
{
    string CreateToken(AppUser user, IReadOnlyCollection<string> roles, IReadOnlyCollection<string> permissions);
}
