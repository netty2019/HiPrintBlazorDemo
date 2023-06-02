namespace HiPrintTest.Models
{
    public class Order
    {
        public OrderType? Type { get; set; }

        public string? Code { get; set; }

        public string? CustomerCode { get; set; }

        public string? CustomerName { get; set; }

        public decimal? Price { get; set; }

        public DateTime Date { get; set; }

        public List<OrderItem>? Items { get; set; }
    }

    public class OrderItem
    {
        public int ItemId { get; set; }

        public string? ProductName { get; set; }

        public int Quantity { get; set; }
    }

    public enum OrderType 
    {
       Type1,
       Type2, Type3, Type4, Type5, Type6,
    }
}
