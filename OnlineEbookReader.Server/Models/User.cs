namespace OnlineEbookReader.Server.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string PassowrdHash { get; set; } = "";
        public int[] BookIds {get; set;} = [];
    }
}
