using Microsoft.AspNetCore.Mvc;
using OnlineEbookReader.Server.Models;
using OnlineEbookReader.Server.Data;
using VersOne.Epub;

namespace OnlineEbookReader.Server.Controllers
{
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
            var result = _context.Books.Select(x => new Book
            {
                Id = x.Id,
                Title = x.Title,
                Author = x.Author,
                Description = x.Description,
                CoverImageUrl = x.CoverImageUrl,
                FileUrl = x.FileUrl,
            }).ToArray();

            return result;
        }

        [HttpGet]
        [Route("id")]
        public ActionResult<Book> GetBookById([FromBody] int id) {
            return _context.Books
                .Where(x => x.Id == id)
                .Single();
        }

        [HttpGet]
        [Route("search")]
        public IEnumerable<Book> GetBookByTitleOrAuthor(string searchParam) {
            var contains = (string container, string search) => {
                if (container == null)
                    return false;
                return container.ToLower().Contains(search.ToLower());
            };
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
                    contains (x.Title, searchParam)
                    || contains (x.Author, searchParam)
                    || contains (x.Description, searchParam));

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
            _context.SaveChanges();
            return Ok(new {file.Name, file.Length});
        }

    }
}
