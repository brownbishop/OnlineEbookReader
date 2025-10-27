using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;
using OnlineEbookReader.Server.Models;
using OnlineEbookReader.Server.Data;
using VersOne.Epub;

namespace OnlineEbookReader.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("[controller]")]
    public class BooksController : ControllerBase
    {
        private int lastBookId;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public BooksController(IWebHostEnvironment env, AppDbContext context)
        {
            _env = env;
            _context = context;
            lastBookId = _context.Books
                .Select(x => x.Id)
                .ToArray()
                .DefaultIfEmpty(0)
                .Max();
        }

        // GET: BooksController
        [HttpGet(Name = "GetBooks")]
        public IEnumerable<Book> GetBooks()
        {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
            {
                return [];
            }

            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
            {
                return [];
            }
            
            var result = _context.Books.Select(x => new Book
            {
                Id = x.Id,
                Title = x.Title,
                Author = x.Author,
                Description = x.Description,
                CoverImageUrl = x.CoverImageUrl,
                FileUrl = x.FileUrl,
            }).ToArray().Where(x => user.BookIds.Contains(x.Id));

            return result;
        }

        [HttpGet("{id}")]
        public ActionResult<Book> GetBookById(int id)
        {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
            {
                return BadRequest("current user is not found");
            }

            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
            {
                return BadRequest("failed to find user in database");
            }
            
            var book =  _context.Books.Find( id);
            
            if (book == null)
                return BadRequest("Book not found");
            
            if (!user.BookIds.Contains(book.Id))
                return BadRequest("current user doesn't own book");
            
            return book;
        }

        [HttpGet("download/{id}")]
        public ActionResult DownloadBookById(int id)
        {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
            {
                return BadRequest("current user is not found");
            }

            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
            {
                return BadRequest("failed to find user in database");
            }
            
            var book =  _context.Books.Find( id);
            
            if (book == null)
                return BadRequest("Book not found");
            
            if (!user.BookIds.Contains(book.Id))
                return BadRequest("current user doesn't own book");
            
            if (!System.IO.File.Exists(book.FileUrl))
                return BadRequest($"No file associated with book {book.Title} {book.FileUrl}");

            return File(System.IO.File.OpenRead(book.FileUrl), "application/octet-stream", Path.GetFileName(book.FileUrl));
        }

        [HttpGet("downloadcover/{id}")]
        public ActionResult DownloadBookCoverById(int id)
        {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
            {
                return BadRequest("current user is not found");
            }

            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
            {
                return BadRequest("failed to find user in database");
            }
            
            var book =  _context.Books.Find( id);
            
            if (book == null)
                return BadRequest("Book not found");
            
            if (!user.BookIds.Contains(book.Id))
                return BadRequest("current user doesn't own book");
            
            if (!System.IO.File.Exists(book.CoverImageUrl))
                return BadRequest($"No file associated with book {book.Title}");

            return File(System.IO.File.OpenRead(book.CoverImageUrl), "application/octet-stream", Path.GetFileName(book.FileUrl));
        }

        [HttpGet]
        [Route("search")]
        public IEnumerable<Book> GetBookByTitleOrAuthor(string searchParam) {
            var contains = (string container, string search) => {
                if (container == null)
                    return false;
                return container.ToLower().Contains(search.ToLower());
            };
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
            {
                return [];
            }

            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
            {
                return [];
            } 
            
            var books = _context.Books.Select(x => new Book
            {
                Id = x.Id,
                Title = x.Title,
                Author = x.Author,
                Description = x.Description,
                CoverImageUrl = x.CoverImageUrl,
                FileUrl = x.FileUrl,
            }).ToArray();

            return books.Where(x =>
                    user.BookIds.Contains(x.Id) 
                    || contains (x.Title, searchParam)
                    || contains (x.Author, searchParam)
                    || contains (x.Description, searchParam));

        }

        [HttpPost]
        public async Task<ActionResult<Book>> Post([FromBody] Book book) {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
                return BadRequest("failed to find current user from token"); 
            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
                return BadRequest($"failed to find {username} in database"); 
            
            _context.Books.Add(book);
            user.BookIds = user.BookIds.Append(book.Id).ToArray();
            await _context.SaveChangesAsync();
            return Created($"Books/{book.Id}", book);
        }

        [HttpPost("Upload")]
        public async Task<IActionResult> Post(IFormFile file)
        {
            var username = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (username == null)
            {
                return BadRequest("current user is not found");
            }

            var user = _context.Users.Where(x => x.Name == username).FirstOrDefault();
            if (user == null)
            {
                return BadRequest("failed to find user in database");
            }
            
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

            lastBookId++;
            Book book = new Book {
                Id = lastBookId,
                FileUrl = filePath,
            };
            EpubBookRef bookRef = EpubReader.OpenBook(filePath);
            book.Author = bookRef.Author;
            book.Description = bookRef.Description ?? "";
            book.Title = bookRef.Title;
            var cover = bookRef.ReadCover();
            if (cover != null) {
                book.CoverImageUrl = Path.Combine(uploadsPath, $"{book.Id}.png");
                await using (var stream = new FileStream(book.CoverImageUrl, FileMode.Create))
                {
                    stream.Write(cover, 0, cover.Length);
                }

            }

            _context.Books.Add(book);
            user.BookIds = user.BookIds.Append(book.Id).ToArray();
            _context.SaveChanges();
            return Ok(new {file.Name, file.Length});
        }

    }
}
