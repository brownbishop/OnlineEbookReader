using Microsoft.AspNetCore.Mvc;
using OnlineEbookReader.Server.Models;
using OnlineEbookReader.Server.Data;

namespace OnlineEbookReader.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class BooksController : ControllerBase 
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env; 

        public BooksController(IWebHostEnvironment env, AppDbContext context)
        {
            _env = env;
            _context = context;
        }

        // GET: BooksController
        [HttpGet(Name = "GetBooks")]
        public IEnumerable<Book> GetBooks()
        {
            var result = _context.Books.Select(x => new Book
            {
                Id = x.Id,
                Title = x.Title,
                Author = x.Author,
                Description = x.Description,
                CoverImageUrl = x.CoverImageUrl,
                FileUrl = x.FileUrl,
            }).ToArray();

            return Enumerable.Range(1, 5).Select(index => new Book
            {
                Id = index,
                Author = $"Author {index}",
                Title = $"Title {index}",
                Description = $"Description {index}",
            });
        }

        [HttpPost]
        public async Task<ActionResult<Book>> Post([FromBody] Book book) { 
            _context.Books.Add(book);
            await _context.SaveChangesAsync();
            return Created($"Books/{book.Id}", book);   
        }

        [HttpPost]
        [Route("UploadBook")]
        public async Task<IActionResult> Post(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            
            var fileExtension = Path.GetExtension(file.FileName);
            if (fileExtension != ".epub" && fileExtension != ".epub3")
                return BadRequest("File format not supported, please upload epub files next time!");
            
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}"; 
            var uploadsPath = Path.Combine(_env.WebRootPath,  "uploads");
            Console.Error.WriteLine($"{_env.WebRootFileProvider} {_env.WebRootPath} {file.Name}");
                
            if (!Directory.Exists(uploadsPath))
            {
                Directory.CreateDirectory(uploadsPath);
            }
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new {file.Name, file.Length}); 
        }
        
    }
}
