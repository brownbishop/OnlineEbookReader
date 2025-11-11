using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineEbookReader.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBookProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Progress",
                table: "Books",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Progress",
                table: "Books");
        }
    }
}
