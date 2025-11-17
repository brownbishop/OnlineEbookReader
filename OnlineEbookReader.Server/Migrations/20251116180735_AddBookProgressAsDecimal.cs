using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineEbookReader.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddBookProgressAsDecimal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Progress",
                table: "Books",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
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
