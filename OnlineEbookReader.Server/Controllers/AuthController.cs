using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using OnlineEbookReader.Server.Data;
using OnlineEbookReader.Server.Models;
using static BCrypt.Net.BCrypt;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public IActionResult Login([FromBody] UserLogin user)
    {
        var dbUser = _context.Users.FirstOrDefault(x => x.Name == user.Name);

        if (dbUser == null)
        {
            return BadRequest("incorrect username or password");
        }
        
        
        if (Verify(user.Password, dbUser.PassowrdHash) )
        {
            var token = GenerateJwtToken(user.Name);
            return Ok(new { token });
        }

        return BadRequest("incorrect username or password");
    }

    [HttpPost("signup")]
    public IActionResult Signup([FromBody] UserLogin user)
    {
        var dbUser = _context.Users
            .Where(x => x.Name == user.Name)
            .ToArray()
            .DefaultIfEmpty(null)
            .FirstOrDefault();
        var lastId = _context.Users
            .Select(x => x.Id)
            .ToArray()
            .DefaultIfEmpty(0)
            .Max();
        
        if (dbUser != null)
        {
            return BadRequest("User already exists");
        }
        
        var hash = HashPassword(user.Password ); 
        dbUser = new User { Id = lastId + 1, Name = user.Name, PassowrdHash = hash };
        _context.Users.Add(dbUser);
        _context.SaveChanges();
        
        return Ok($"Created {user.Name}");
    }


    private string GenerateJwtToken(string username)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "OnlineEbookReader.issuer.com",
            audience: "OnlineEbookReader.audience",
            claims: claims,
            expires: DateTime.Now.AddMinutes(60),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
